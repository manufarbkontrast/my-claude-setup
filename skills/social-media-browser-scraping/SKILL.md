# Social Media Profile Scraping via Browser

**Extracted:** 2026-02-13
**Context:** Extracting accurate follower/following counts from Instagram and TikTok

## Problem

API-based and meta-tag scraping methods often return:
- Cached/stale data
- Rounded numbers
- Missing fields

Need reliable live data extraction for KPI dashboards.

## Solution

Use Chrome browser automation to screenshot profile headers and extract values.

### Instagram Profile Header

```
[Posts] Beitraege  [Follower] Follower  [Following] Gefolgt

Example: "903 Beitraege  3.678 Follower  448 Gefolgt"
```

### TikTok Profile Header

```
[Following] Gefolgt  [Followers] Follower*innen  [Likes] Gefaellt mir

Example: "12 Gefolgt  898 Follower*innen  14,3 Tsd. Gefaellt mir"
```

## Implementation

```python
# 1. Get tab context
tabs_context_mcp()

# 2. Navigate to profile
navigate(tabId, url="https://instagram.com/username")

# 3. Wait for page load, then screenshot
computer(action="screenshot", tabId=tabId)

# 4. Extract values from screenshot visually
# Instagram: Look for header row with 3 numbers
# TikTok: Look for header row with 3 numbers
```

## Number Format Handling

| Platform | Format | Example | Parsed |
|----------|--------|---------|--------|
| Instagram DE | X.XXX | 3.678 | 3678 |
| TikTok DE | X,X Tsd. | 14,3 Tsd. | 14300 |
| TikTok DE | X Mio. | 1,2 Mio. | 1200000 |

## When to Use

- Weekly KPI dashboard updates
- When Firecrawl/API data seems stale
- User reports data discrepancy
- Accuracy is more important than speed

## Advantages over API/Scraping

1. **Always live** - No caching layer
2. **No rate limiting** - Manual browser simulation
3. **Visual verification** - Screenshot proves accuracy
4. **Works without login** - Public profiles accessible

## Limitations

- Slower than API calls
- Requires active browser tab
- May hit login prompts after many requests
- Number parsing from screenshots can be error-prone
