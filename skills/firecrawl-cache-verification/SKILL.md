# Firecrawl Meta-Tag Cache Verification Pattern

**Extracted:** 2026-02-13
**Context:** Web scraping social media profiles when data accuracy is critical

## Problem

Firecrawl extracts data from HTML meta-tags (og:description, etc.) which are often:
- Cached by CDNs
- Updated less frequently than the actual page content
- Stale by hours or days

Example: Firecrawl reported Instagram "Following: 460" but actual live value was 448.

## Solution

When data accuracy matters, use a two-step verification approach:

1. **Initial scrape with Firecrawl** (fast, good for bulk data)
2. **Browser verification for critical values** (accurate, slower)

```
# Step 1: Quick scrape
firecrawl_scrape(url, formats=["markdown"])

# Step 2: If values seem off or accuracy is critical
browser.navigate(url)
browser.screenshot()  # Visual verification
# Extract values from screenshot
```

## When to Use

- Social media KPI tracking where exact numbers matter
- Any scraping where user reports discrepancy
- Financial or statistical data extraction
- When Firecrawl returns round numbers or values that seem "too clean"

## Verification Signals

Values that warrant browser verification:
- User reports data mismatch
- Numbers ending in 0 or 5 (often rounded/cached)
- Values unchanged from previous scrape
- Time-sensitive metrics (follower counts, stock prices)

## Example: Instagram Profile Verification

```
# Firecrawl meta-tag extraction
og:description: "903 Beitraege, 3,678 Followers, 460 Following"
                                                 ^^^^ CACHED!

# Browser screenshot shows actual header:
"903 Beitraege  3.678 Follower  448 Gefolgt"
                                ^^^ LIVE!
```

## Related Tools

- `mcp__Claude_in_Chrome__navigate` + `mcp__Claude_in_Chrome__computer(screenshot)`
- Alternative: Playwright for headless browser verification
