---
name: repository-pattern-scaffold
description: Scaffold Repository Pattern with findAll, findById, create, update, delete for new entities. Generates interfaces, implementations, and test stubs for TypeScript, Python, and Go. Use when creating data access layers, new CRUD entities, or abstracting storage.
version: 1.0.0
disable-model-invocation: true
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - repository pattern
    - data access
    - crud
    - abstraction
    - interface
    - dependency injection
    - storage
    - database
    - testing
    - mock
---

# Repository Pattern Scaffold

Generate a complete Repository Pattern implementation for any entity. Encapsulates data access behind a consistent interface with standard CRUD operations.

## When to Use

- Creating a new data entity that needs persistence
- Abstracting database access for testability
- Switching storage backends (database → API, in-memory → database)
- Setting up clean architecture data layers

## Usage

Invoke with: `/repository-pattern-scaffold <EntityName> [fields...] [--lang=typescript|python|go]`

Arguments:
- `EntityName`: PascalCase entity name (e.g., `User`, `Product`, `Order`)
- `fields`: Optional field definitions (e.g., `name:string email:string age:number`)
- `--lang`: Target language (default: `typescript`)

Examples:
```
/repository-pattern-scaffold User name:string email:string
/repository-pattern-scaffold Product title:string price:number --lang=python
/repository-pattern-scaffold Order --lang=go
```

## Generated Structure

For entity `User` in TypeScript:

```
src/
  domain/
    user.ts              # Entity type definition
  repositories/
    user-repository.ts   # Repository interface
    user-repository-impl.ts  # Database implementation
    user-repository-memory.ts # In-memory implementation (for tests)
  __tests__/
    user-repository.test.ts  # Test stubs
```

## Core Interface

### TypeScript

```typescript
// repositories/user-repository.ts

interface UserRepository {
  readonly findAll: (options?: QueryOptions) => Promise<readonly User[]>;
  readonly findById: (id: string) => Promise<User | null>;
  readonly create: (data: CreateUserInput) => Promise<User>;
  readonly update: (id: string, data: UpdateUserInput) => Promise<User>;
  readonly delete: (id: string) => Promise<void>;
}

interface QueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: string;
  readonly order?: "asc" | "desc";
}
```

### Entity Type

```typescript
// domain/user.ts

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Input types omit auto-generated fields
type CreateUserInput = Omit<User, "id" | "createdAt" | "updatedAt">;
type UpdateUserInput = Partial<CreateUserInput>;
```

### In-Memory Implementation

```typescript
// repositories/user-repository-memory.ts

const createInMemoryUserRepository = (): UserRepository => {
  let store: readonly User[] = [];

  return {
    findAll: async (options) => {
      const { limit, offset = 0 } = options ?? {};
      const sliced = store.slice(offset, limit ? offset + limit : undefined);
      return sliced;
    },

    findById: async (id) => {
      return store.find((u) => u.id === id) ?? null;
    },

    create: async (data) => {
      const now = new Date();
      const user: User = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      store = [...store, user]; // immutable append
      return user;
    },

    update: async (id, data) => {
      const existing = store.find((u) => u.id === id);
      if (!existing) {
        throw new Error(`User not found: ${id}`);
      }
      const updated: User = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };
      store = store.map((u) => (u.id === id ? updated : u)); // immutable update
      return updated;
    },

    delete: async (id) => {
      const exists = store.some((u) => u.id === id);
      if (!exists) {
        throw new Error(`User not found: ${id}`);
      }
      store = store.filter((u) => u.id !== id); // immutable delete
    },
  };
};
```

### Database Implementation (Template)

```typescript
// repositories/user-repository-impl.ts

const createUserRepository = (db: Database): UserRepository => ({
  findAll: async (options) => {
    const { limit = 50, offset = 0, orderBy = "createdAt", order = "desc" } =
      options ?? {};
    const rows = await db.query(
      `SELECT * FROM users ORDER BY $1 ${order} LIMIT $2 OFFSET $3`,
      [orderBy, limit, offset],
    );
    return rows.map(mapRowToUser);
  },

  findById: async (id) => {
    const row = await db.queryOne("SELECT * FROM users WHERE id = $1", [id]);
    return row ? mapRowToUser(row) : null;
  },

  create: async (data) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const row = await db.queryOne(
      `INSERT INTO users (id, name, email, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, data.name, data.email, now, now],
    );
    return mapRowToUser(row);
  },

  update: async (id, data) => {
    // Build SET clause dynamically from provided fields
    const fields = Object.entries(data).filter(([, v]) => v !== undefined);
    if (fields.length === 0) {
      const existing = await db.queryOne(
        "SELECT * FROM users WHERE id = $1",
        [id],
      );
      if (!existing) throw new Error(`User not found: ${id}`);
      return mapRowToUser(existing);
    }
    const setClauses = fields.map(([k], i) => `${k} = $${i + 2}`);
    const values = fields.map(([, v]) => v);
    const row = await db.queryOne(
      `UPDATE users SET ${setClauses.join(", ")}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    if (!row) throw new Error(`User not found: ${id}`);
    return mapRowToUser(row);
  },

  delete: async (id) => {
    const result = await db.execute("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0) throw new Error(`User not found: ${id}`);
  },
});
```

### Test Stubs

```typescript
// __tests__/user-repository.test.ts

describe("UserRepository", () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = createInMemoryUserRepository();
  });

  describe("create", () => {
    it("should create a user and return it with id", async () => {
      const user = await repo.create({ name: "Alice", email: "a@b.com" });
      expect(user.id).toBeDefined();
      expect(user.name).toBe("Alice");
    });
  });

  describe("findById", () => {
    it("should return user by id", async () => {
      const created = await repo.create({ name: "Bob", email: "b@b.com" });
      const found = await repo.findById(created.id);
      expect(found).toEqual(created);
    });

    it("should return null for unknown id", async () => {
      const found = await repo.findById("nonexistent");
      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("should return new object with updated fields", async () => {
      const original = await repo.create({ name: "Eve", email: "e@b.com" });
      const updated = await repo.update(original.id, { name: "Eva" });
      expect(updated.name).toBe("Eva");
      expect(updated.email).toBe("e@b.com");
      expect(updated.id).toBe(original.id);
    });
  });

  describe("delete", () => {
    it("should remove user from store", async () => {
      const user = await repo.create({ name: "Del", email: "d@b.com" });
      await repo.delete(user.id);
      const found = await repo.findById(user.id);
      expect(found).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      await repo.create({ name: "A", email: "a@b.com" });
      await repo.create({ name: "B", email: "b@b.com" });
      const all = await repo.findAll();
      expect(all).toHaveLength(2);
    });
  });
});
```

## Key Principles

1. **Immutable operations** — `create`, `update` return new objects; never mutate input
2. **Interface-first** — define the interface before any implementation
3. **In-memory for tests** — always generate an in-memory implementation for unit tests
4. **Error on missing** — `update` and `delete` throw if entity not found
5. **Readonly types** — use `readonly` for all entity properties and arrays
6. **No leaky abstractions** — repository interface has no database-specific types

## Best Practices

- **One repository per entity** — don't combine multiple entities in one repo
- **Keep repositories thin** — business logic belongs in services, not repos
- **Use dependency injection** — pass repositories to services via constructor/factory
- **Paginate by default** — `findAll` should accept `limit`/`offset`
- **Map at the boundary** — convert DB rows to domain types inside the repository

## Common Pitfalls

- **Mutating returned entities** — always return new objects from repo methods
- **Leaking DB types** — repo should return domain types, not raw DB rows
- **Fat repositories** — complex queries belong in dedicated query services
- **Missing error handling** — always handle not-found and constraint violations
- **Skipping the interface** — without an interface, you can't swap implementations

## When to Load References

- For TypeScript + Prisma/Drizzle → `references/typescript-repository.md`
- For Python + SQLAlchemy/Pydantic → `references/python-repository.md`
- For Go + GORM/sqlx → `references/go-repository.md`
