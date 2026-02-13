# Next.js Full-Stack Type Threading

**Extracted:** 2025-02-13
**Context:** Adding new data fields across a full Next.js stack (API → types → hook → UI)

## Problem

When a backend API starts returning new fields (e.g., from a new data source), the data must be threaded through 5 type layers. Missing any layer causes data to silently disappear — TypeScript won't warn about optional fields that aren't forwarded.

## Solution

### The 5-Layer Checklist

When adding new fields to an API response, update ALL of these in order:

```
1. Domain Type          (src/lib/youtube/types.ts)          → ChannelResult
2. API Response Type    (src/components/.../detail-types.ts) → ChannelApiChannelData
3. UI Data Type         (src/components/.../detail-types.ts) → ChannelDetailData
4. Hook Normalizer      (src/hooks/use-channel-detail.ts)   → normalizeChannel()
5. Hook Merger          (src/hooks/use-channel-detail.ts)   → mergeResponses()
6. UI Component         (src/components/.../content.tsx)     → props + JSX
```

### Layer 1: Domain Type (backend output)

```typescript
// src/lib/youtube/types.ts
export interface ChannelResult {
  // ... existing fields
  // New fields are OPTIONAL (source may not provide them)
  readonly socialLinks?: readonly SocialLink[];
  readonly websiteUrl?: string | null;
}
```

### Layer 2: API Response Type (what the client receives)

```typescript
// detail-types.ts — ChannelApiChannelData
// Covers BOTH cache format (snake_case) and fresh format (camelCase)
export interface ChannelApiChannelData {
  // Fresh format
  readonly socialLinks?: readonly SocialLink[];
  readonly websiteUrl?: string | null;
  // No cache format needed if enrichment only comes from fresh fetch
}
```

### Layer 3: UI Data Type (what components consume)

```typescript
// detail-types.ts — ChannelDetailData
// Fields are NON-OPTIONAL with safe defaults
export interface ChannelDetailData {
  readonly socialLinks: readonly SocialLink[];  // default: []
  readonly websiteUrl: string | null;           // default: null
  readonly isVerified: boolean;                 // default: false
}
```

### Layer 4: Hook Normalizer (cache vs fresh resolution)

```typescript
// use-channel-detail.ts — normalizeChannel()
function normalizeChannel(ch: ChannelApiChannelData) {
  return {
    // ... existing fields with ?? fallbacks
    // New fields with safe defaults
    socialLinks: ch.socialLinks ?? [],
    websiteUrl: ch.websiteUrl ?? null,
    isVerified: ch.isVerified ?? false,
  };
}
```

### Layer 5: Hook Merger (combine multiple API responses)

```typescript
// use-channel-detail.ts — mergeResponses()
function mergeResponses(channelRes, healthRes): ChannelDetailData {
  const normalized = normalizeChannel(channelRes.channel);
  return {
    // ... existing fields
    // Pass through normalized enrichment fields
    socialLinks: normalized.socialLinks,
    websiteUrl: normalized.websiteUrl,
    isVerified: normalized.isVerified,
  };
}
```

### Key Principle: Cache vs Fresh Dual Format

This project stores channel data in Supabase (snake_case columns) and also fetches fresh data (camelCase fields). The normalizer handles both:

```typescript
// Pattern: camelCase (fresh) ?? snake_case (cached) ?? default
channelTitle: ch.channelTitle ?? ch.title ?? '',
uploadsPerWeek60d: ch.uploadsPerWeek60d ?? ch.uploads_per_week_60d ?? 0,
// Enrichment-only fields only come from fresh fetch:
socialLinks: ch.socialLinks ?? [],
```

## When to Use

- Adding any new field to an API response in a Next.js app with this architecture
- When data passes through: API route → response type → detail type → hook → component
- When you see new API fields not appearing in the UI despite correct backend
- When extending a system that has separate cache and fresh data paths
