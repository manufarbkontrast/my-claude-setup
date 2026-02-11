---
name: error-envelope-generator
description: Generate consistent API response envelope types and helpers. Scaffolds success/error/paginated response patterns for TypeScript, Python, and Go. Use when creating new APIs, standardizing response formats, or adding pagination.
version: 1.0.0
disable-model-invocation: true
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - api
    - response
    - envelope
    - error handling
    - pagination
    - rest api
    - json response
    - success response
    - error response
---

# Error Envelope Generator

Generate consistent API response envelope types and helper functions following the standard pattern:

```
{ success: boolean, data: T | null, error: string | null, metadata?: PaginationMeta }
```

## When to Use

- Creating a new REST API from scratch
- Standardizing inconsistent response formats across endpoints
- Adding pagination to existing endpoints
- Scaffolding response types for a new language/framework

## Usage

Invoke with: `/error-envelope-generator <language> [framework]`

Arguments:
- `language`: `typescript`, `python`, or `go`
- `framework` (optional): `express`, `fastapi`, `gin`, `echo`, `hono`, `nextjs`

If no arguments provided, generate TypeScript types by default.

## Core Envelope Structure

### Standard Response

```
ApiResponse<T> {
  success: boolean       // true for 2xx, false for errors
  data: T | null         // payload on success, null on error
  error: string | null   // error message on failure, null on success
}
```

### Paginated Response

```
PaginatedResponse<T> extends ApiResponse<T[]> {
  metadata: {
    total: number        // total items across all pages
    page: number         // current page (1-indexed)
    limit: number        // items per page
    totalPages: number   // ceil(total / limit)
  }
}
```

### Error Response with Code

```
ErrorResponse extends ApiResponse<null> {
  errorCode: string      // machine-readable code (e.g., "USER_NOT_FOUND")
  details?: unknown      // optional validation errors or extra context
}
```

## TypeScript Implementation

```typescript
// types/api-response.ts

interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
}

interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

interface PaginatedResponse<T> extends ApiResponse<readonly T[]> {
  readonly metadata: PaginationMeta;
}

interface ErrorDetail {
  readonly errorCode: string;
  readonly details?: unknown;
}

type ApiErrorResponse = ApiResponse<null> & ErrorDetail;
```

```typescript
// helpers/api-response.ts

const successResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  error: null,
});

const errorResponse = (
  message: string,
  errorCode: string,
  details?: unknown,
): ApiErrorResponse => ({
  success: false,
  data: null,
  error: message,
  errorCode,
  details,
});

const paginatedResponse = <T>(
  data: readonly T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> => ({
  success: true,
  data,
  error: null,
  metadata: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});
```

## HTTP Status Code Mapping

| Scenario | Status | Helper |
|----------|--------|--------|
| Success (single item) | 200 | `successResponse(item)` |
| Created | 201 | `successResponse(newItem)` |
| No Content | 204 | (empty body) |
| List with pagination | 200 | `paginatedResponse(items, total, page, limit)` |
| Validation error | 400 | `errorResponse(msg, "VALIDATION_ERROR", errors)` |
| Unauthorized | 401 | `errorResponse(msg, "UNAUTHORIZED")` |
| Forbidden | 403 | `errorResponse(msg, "FORBIDDEN")` |
| Not found | 404 | `errorResponse(msg, "NOT_FOUND")` |
| Conflict | 409 | `errorResponse(msg, "CONFLICT")` |
| Rate limited | 429 | `errorResponse(msg, "RATE_LIMITED")` |
| Server error | 500 | `errorResponse(msg, "INTERNAL_ERROR")` |

## Error Code Registry Pattern

Define error codes as constants to prevent typos and enable autocomplete:

```typescript
// constants/error-codes.ts

const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

## Best Practices

1. **Always use the envelope** — even for single-item responses, wrap in `ApiResponse<T>`
2. **Never leak stack traces** — `error` field should be user-friendly, log details server-side
3. **Use error codes** — machine-readable codes enable client-side error handling
4. **Pagination is 1-indexed** — page 1 is the first page (more intuitive for clients)
5. **Immutable responses** — all response types use `readonly` properties
6. **Type narrowing** — clients can check `success` to narrow `data` vs `error`

## Common Pitfalls

- **Inconsistent envelope** — mixing raw data responses with envelope responses
- **Leaking sensitive data** in error details (stack traces, SQL queries, internal paths)
- **Forgetting `totalPages`** — clients need this to render pagination controls
- **0-indexed pages** — confusing for API consumers; use 1-indexed
- **Mutable response objects** — always return new objects, never modify in middleware

## When to Load References

- For TypeScript + Express/Hono/Next.js helpers → `references/typescript-envelope.md`
- For Python + FastAPI/Pydantic models → `references/python-envelope.md`
- For Go + Gin/Echo structs → `references/go-envelope.md`
