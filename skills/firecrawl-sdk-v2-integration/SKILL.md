# Firecrawl JS SDK v2 — Correct API Usage

**Extracted:** 2025-02-13
**Context:** Integrating `@mendable/firecrawl-js` for web scraping in a Next.js app

## Problem

The Firecrawl JS SDK (`@mendable/firecrawl-js`) v2 has a different API than older versions and many online examples. Using the wrong method names (`scrapeUrl` instead of `scrape`) causes TypeScript build failures.

## Solution

### Correct Import & Constructor

```typescript
import Firecrawl from '@mendable/firecrawl-js';

// The default export `Firecrawl` extends `FirecrawlClient`
// Constructor accepts `FirecrawlClientOptions`:
const client = new Firecrawl({
  apiKey: 'fc-selfhosted',        // Dummy key for self-hosted instances
  apiUrl: 'http://localhost:3002', // Self-hosted URL
});
```

### Correct Method: `scrape()` (NOT `scrapeUrl()`)

```typescript
// WRONG (old API / other SDKs):
const result = await client.scrapeUrl(url, { formats: ['markdown'] });

// CORRECT (v2):
const result = await client.scrape(url, { formats: ['markdown'] });
```

### Return Type: `Document` (no `success` wrapper)

```typescript
// WRONG assumption:
if (!result.success || !result.markdown) { ... }

// CORRECT — Document has optional `markdown` directly:
interface Document {
  markdown?: string;
  html?: string;
  rawHtml?: string;
  json?: unknown;
  summary?: string;
  metadata?: DocumentMetadata;
  links?: string[];
  images?: string[];
  screenshot?: string;
}

// Check directly:
if (!result.markdown) {
  console.warn('No content returned');
}
```

### Self-Hosted Configuration

- Self-hosted instances ignore the API key — use any non-empty string (`fc-selfhosted`)
- Set `apiUrl` to point to the self-hosted instance URL
- The SDK reads `FIRECRAWL_API_URL` env var as fallback for `apiUrl`

### Build Warning: `undici` Module Not Found

The SDK optionally depends on `undici`. This produces a build **warning** (not error) in Next.js:

```
Module not found: Can't resolve 'undici' in '.../firecrawl-js/dist'
```

This is harmless — the SDK works without it. No action needed.

## When to Use

- When integrating `@mendable/firecrawl-js` in any project
- When seeing `Property 'scrapeUrl' does not exist on type 'Firecrawl'`
- When seeing `Property 'success' does not exist on type 'Document'`
- When configuring Firecrawl for a self-hosted instance
