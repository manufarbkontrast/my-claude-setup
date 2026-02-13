# Optional Feature Enrichment Pipeline

**Extracted:** 2025-02-13
**Context:** Adding optional data sources to an existing API without breaking core functionality

## Problem

When adding an optional data enrichment step (e.g., web scraping, third-party API) to an existing API route, failures in the enrichment must never break the primary response. The feature should be toggleable via environment variable.

## Solution

### 3-Layer Graceful Degradation Pattern

**Layer 1 — Feature Toggle (Client Factory)**

```typescript
// lib/scraping/firecrawl-client.ts
export function isFeatureEnabled(): boolean {
  return Boolean(process.env.FEATURE_API_URL);
}

export function createClient(): Client | null {
  const url = process.env.FEATURE_API_URL;
  if (!url) return null;  // Feature disabled
  return new Client({ apiUrl: url });
}
```

**Layer 2 — Service Function (null return on failure)**

```typescript
// lib/scraping/channel-scraper.ts
export async function enrichData(input: string): Promise<EnrichedData | null> {
  const client = createClient();
  if (!client) return null;  // Layer 1: not configured

  try {
    const result = await client.fetch(input);
    if (!result.data) return EMPTY_DATA;  // No content
    return parseResult(result.data);
  } catch (error) {
    console.error('[enrichData] Failed:', error);
    return null;  // Layer 2: transient failure
  }
}
```

**Layer 3 — API Route (catch + conditional merge)**

```typescript
// app/api/resource/route.ts
let enrichedData: EnrichedData | null = null;

if (isFeatureEnabled()) {
  try {
    enrichedData = await enrichData(primaryData.url);
  } catch (err) {
    console.error('Enrichment failed:', err);
    // Continue without enriched data
  }
}

// Conditional spread — only adds fields when data exists
const response: ResourceResult = {
  ...primaryData,
  ...(enrichedData ? {
    extraField1: enrichedData.field1,
    extraField2: enrichedData.field2,
  } : {}),
};
```

### Frontend: Conditional Rendering

```tsx
// Only render section when enrichment data exists
const hasEnrichedData = links.length > 0 || website || email;

if (!hasEnrichedData) return null;

return <Card>...</Card>;
```

### Type Pattern: Optional Fields

```typescript
// Domain type: fields are optional (may not exist)
interface ResourceResult {
  readonly id: string;
  readonly name: string;
  // Enriched fields (optional)
  readonly extraField1?: string;
  readonly extraField2?: string[];
}

// UI type: fields have defaults (always exist)
interface ResourceDetailData {
  readonly extraField1: string | null;   // null = not available
  readonly extraField2: readonly string[]; // [] = empty
}
```

## Example

Real-world usage from this project: Firecrawl web scraping enriches YouTube channel data with social links, email, verified badge — data not available from the YouTube API. When Firecrawl is not running or not configured, the channel page works fine with just API data.

## When to Use

- Adding a secondary data source to an existing API
- Integrating third-party services that may be unreliable
- Building features that should be opt-in via environment variables
- Any enrichment step where partial data is acceptable
