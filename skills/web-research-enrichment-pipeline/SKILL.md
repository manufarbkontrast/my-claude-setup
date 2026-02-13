---
name: web-research-enrichment-pipeline
description: Resilient web research pipeline using firecrawl_search for product data enrichment. Uses JSON intermediate storage for resumability and 3-level merge strategy (source → research → fallback).

  Keywords: web research, firecrawl, product enrichment, data pipeline, json cache, merge strategy, marketplace, zalando, product descriptions, material composition, etl, rate limiting
license: MIT
---

# Web Research Enrichment Pipeline

**Status**: Production Ready
**Extracted:** 2026-02-13
**Context:** Enriching product catalogs with web-researched data (descriptions, materials, specifications) using firecrawl_search, with JSON as intermediate storage and multi-level merge strategy

---

## Problem

Product feeds from suppliers contain only basic data (brand, SKU, EAN, category) but marketplaces require rich data (descriptions, materials, gender targeting). Web research via APIs like firecrawl is needed, but faces rate limiting, large response sizes, and incomplete results. Need a resilient pipeline that can be interrupted, resumed, and manually corrected.

---

## Solution

### Architecture: 3-Stage Pipeline

```
Source (Excel/CSV) → Web Research → JSON intermediate → Merge → Output (Excel)
```

### Stage 1: Web Research with firecrawl_search

**Critical lesson:** Use `firecrawl_search` WITHOUT `scrapeOptions` to avoid:
- Rate limiting (empty `{}` responses)
- Oversized responses (95KB+ per query)
- Timeout errors

```python
# GOOD: Search without scrapeOptions — use description snippets
result = firecrawl_search(query="BRAND product name", limit=5)
# Extract data from search result descriptions (usually sufficient)

# BAD: Search with scrapeOptions — triggers rate limits
result = firecrawl_search(query="...", scrapeOptions={"formats": ["markdown"]})
# Returns 95KB+ or empty {} due to rate limiting
```

**Query strategy (in order of reliability):**
1. `"BRAND product-name material"` — most specific
2. `"BRAND product-name"` — general product info
3. `"EAN/GTIN"` — finds specific product pages (but often limited results)

### Stage 2: JSON Intermediate Storage

Store research results in a JSON file keyed by `"BRAND|ProductName"`:

```json
{
  "BRAND|Product Name Color": {
    "description": "German product description for marketplace...",
    "material.upper_material_clothing": "88% Baumwolle, 12% Polyester",
    "material.futter_clothing": "100% Polyester",
    "gender": "female"
  }
}
```

**Benefits:**
- Resumable: re-run research for missing products only
- Manually editable: fix/improve individual entries
- Auditable: inspect what was found before writing to output
- Cacheable: don't re-research unchanged products

### Stage 3: Multi-Level Merge

```python
def build_product_data(source_product, research=None):
    # Level 1: Source data (always present)
    data = {
        "brand_code": source_product["brand"],
        "ean": source_product["gtin"],
        "name": source_product["name"],
        # ...
    }

    # Level 2: Research overrides (when available)
    if research:
        if research.get("description"):
            data["description"] = research["description"]
        # Dynamic material field merge
        for key, value in research.items():
            if key.startswith("material.") and value:
                data[key] = value

    # Level 3: Fallback generation (when research missing)
    if not data.get("description"):
        data["description"] = f"{data['brand_code']} {data['name']}"

    return data
```

**Lookup key strategy:**
```python
# Try primary key first (most specific), then fallback
research_key = product["gtin"]  # primary: unique identifier
product_research = research.get(research_key)
if not product_research:
    product_research = research.get(f"{brand}|{name}")  # secondary: composite key
```

---

## Key Insights

- **firecrawl_search without scrapeOptions** returns search result descriptions (100-200 chars each) which are usually sufficient for extracting product descriptions and materials. Adding `scrapeOptions: {formats: ["markdown"]}` triggers full page scraping which causes rate limiting and oversized responses.
- **JSON intermediate file is essential** for resilience. Web research for 147 products took multiple rounds with rate limiting. Having a persistent JSON file allows incremental enrichment across sessions.
- **Batch by brand** when researching. Products from the same brand often share material compositions and naming patterns. Research 1-2 products per brand thoroughly, then extrapolate common materials.
- **German descriptions** for DACH marketplaces: search with German keywords or add "deutsch" to queries. Most brand websites have `.de` domains with German content.
- **Conditional override pattern** (`if research.get("field")`) ensures source data is preserved when research is incomplete — never overwrite good data with None.

---

## When to Use

- Enriching product catalogs for marketplace uploads (Zalando, Amazon, Otto, AboutYou)
- Building product description generators from web sources
- Any ETL pipeline that needs external data enrichment with resilience
- Multi-source data merge where some sources may be incomplete
