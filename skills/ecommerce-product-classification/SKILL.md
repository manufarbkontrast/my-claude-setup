---
name: ecommerce-product-classification
description: Hierarchical keyword-based product classification with default fallbacks for 100% coverage. Maps broad supplier categories to specific marketplace sub-categories with multi-language support and color normalization.

  Keywords: ecommerce, product classification, category mapping, keyword rules, zalando, amazon, marketplace, taxonomy, color normalization, product feed, multi-language, product categorization
license: MIT
---

# E-Commerce Product Classification with Keyword Rules

**Status**: Production Ready
**Extracted:** 2026-02-13
**Context:** Mapping products from a generic inventory (with broad categories like "Bekleidung", "Schuhe") to specific marketplace sub-categories (e.g., Zalando's "Hose", "Jacke", "Stiefeletten")

---

## Problem

Product feeds from suppliers/ERPs use broad categories ("Clothing", "Shoes", "Accessories") but marketplace templates require specific sub-categories. Products may also be misclassified at source (e.g., bags labeled as "Accessories"). Need 100% classification coverage — no product should be left unmapped.

---

## Solution

Use a **hierarchical keyword-rule dictionary** with mandatory default fallbacks:

```python
# Structure: base_category → [(keywords, target_category), ..., ([], default)]
CATEGORY_RULES = {
    "Schuhe": [
        (["sneaker"], "Sneaker"),
        (["stiefelette", "ankle", "chelsea"], "Stiefeletten"),
        (["sandale", "sandal"], "Sandalen"),
        ([], "Halbschuhe"),  # DEFAULT — empty keyword list MUST be last
    ],
    "Bekleidung": [
        (["hose", "jogger", "pant", "jean"], "Hose"),
        (["jacke", "jacket", "bomber"], "Jacke"),
        (["pullover", "sweater", "hoodie"], "Pullover"),
        ([], "T-Shirt   Top"),  # default
    ],
    "Accessoires": [
        # Cross-category correction: bags misclassified as accessories
        (["handbag", "bag", "hobo", "shopper", "crossbody"], "Tasche"),
        (["rucksack", "backpack"], "Rucksack"),
        (["gürtel", "belt"], "Gürtel"),
        ([], "Tasche"),  # default for this source (most are bags)
    ],
}

def classify_product(product_name, base_category):
    name_lower = product_name.lower()
    rules = CATEGORY_RULES.get(base_category, CATEGORY_RULES["Accessoires"])
    for keywords, target in rules:
        if not keywords:  # default rule (must be last)
            return target
        if any(kw in name_lower for kw in keywords):
            return target
    return "Uncategorized"  # should never reach here if defaults exist
```

### Color Normalization (companion pattern)

Map multi-language color keywords to canonical codes using **longest-match-first**:

```python
COLOR_MAP = {
    "dark truffle": "brown",  # multi-word MUST come before single-word
    "light graphite": "grey",
    "black": "black", "schwarz": "black", "nero": "black",
    "brown": "brown", "braun": "brown", "cognac": "brown",
    # ...
}

def extract_color(product_name):
    name_lower = product_name.lower()
    # Sort by length descending to match "dark truffle" before "dark"
    for keyword in sorted(COLOR_MAP.keys(), key=len, reverse=True):
        if keyword in name_lower:
            return COLOR_MAP[keyword], keyword
    return "multicolour", ""
```

---

## Key Insights

- **Default rule with empty keyword list MUST be the last entry** in each category's rule list. This guarantees 100% classification coverage.
- **Cross-category correction** handles misclassified source data (e.g., bags in "Accessories" → route to "Tasche").
- **Multi-language keywords** (DE/EN/IT/FR) handle international brand naming (e.g., Carhartt uses English, 10DAYS uses English/Dutch, COCCINELLE uses Italian).
- **Longest-match-first** for colors prevents "navy" matching as substring of "navy blue" or "dark" matching before "dark truffle".
- **Sheet names may use unusual whitespace** — Zalando uses triple-space separators: `"T-Shirt   Top"`, `"Geldbörse   Portemonnaie"`.

---

## When to Use

- Mapping products to Zalando, Amazon, eBay, or Shopify marketplace categories
- Building product taxonomy classifiers for ERP/PIM systems
- Any product feed transformation requiring category normalization
- Color/attribute normalization from multi-language product names
