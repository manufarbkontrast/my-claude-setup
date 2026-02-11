# TypeScript API Envelope - Framework Integrations

## Express.js

```typescript
import { Request, Response, NextFunction } from "express";

// Middleware for consistent error responses
const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = "statusCode" in err ? (err as any).statusCode : 500;
  const errorCode = "errorCode" in err ? (err as any).errorCode : "INTERNAL_ERROR";

  res.status(statusCode).json(
    errorResponse(err.message, errorCode),
  );
};

// Route handler example
app.get("/users/:id", async (req, res) => {
  const user = await userRepo.findById(req.params.id);
  if (!user) {
    return res.status(404).json(
      errorResponse("User not found", "NOT_FOUND"),
    );
  }
  return res.json(successResponse(user));
});

// Paginated route
app.get("/users", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { items, total } = await userRepo.findAll({ page, limit });
  return res.json(paginatedResponse(items, total, page, limit));
});
```

## Hono

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/users/:id", async (c) => {
  const user = await userRepo.findById(c.req.param("id"));
  if (!user) {
    return c.json(errorResponse("User not found", "NOT_FOUND"), 404);
  }
  return c.json(successResponse(user));
});

// Error handler
app.onError((err, c) => {
  return c.json(errorResponse(err.message, "INTERNAL_ERROR"), 500);
});
```

## Next.js App Router

```typescript
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const user = await userRepo.findById(params.id);
  if (!user) {
    return NextResponse.json(
      errorResponse("User not found", "NOT_FOUND"),
      { status: 404 },
    );
  }
  return NextResponse.json(successResponse(user));
}
```

## Zod Validation Integration

```typescript
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

app.post("/users", async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(
      errorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        result.error.flatten(),
      ),
    );
  }
  const user = await userRepo.create(result.data);
  return res.status(201).json(successResponse(user));
});
```
