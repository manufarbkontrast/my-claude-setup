# TypeScript Repository Pattern - Framework Integrations

## Prisma Implementation

```typescript
import { PrismaClient, User as PrismaUser } from "@prisma/client";

const createPrismaUserRepository = (prisma: PrismaClient): UserRepository => ({
  findAll: async (options) => {
    const { limit = 50, offset = 0, orderBy = "createdAt", order = "desc" } =
      options ?? {};
    return prisma.user.findMany({
      take: limit,
      skip: offset,
      orderBy: { [orderBy]: order },
    });
  },

  findById: async (id) => {
    return prisma.user.findUnique({ where: { id } });
  },

  create: async (data) => {
    return prisma.user.create({ data });
  },

  update: async (id, data) => {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  delete: async (id) => {
    await prisma.user.delete({ where: { id } });
  },
});
```

## Drizzle ORM Implementation

```typescript
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";

const createDrizzleUserRepository = (database: typeof db): UserRepository => ({
  findAll: async (options) => {
    const { limit = 50, offset = 0 } = options ?? {};
    return database.select().from(users).limit(limit).offset(offset);
  },

  findById: async (id) => {
    const rows = await database
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ?? null;
  },

  create: async (data) => {
    const rows = await database.insert(users).values({
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return rows[0];
  },

  update: async (id, data) => {
    const rows = await database
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (rows.length === 0) throw new Error(`User not found: ${id}`);
    return rows[0];
  },

  delete: async (id) => {
    const result = await database
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    if (result.length === 0) throw new Error(`User not found: ${id}`);
  },
});
```

## Dependency Injection Pattern

```typescript
// service layer depends on interface, not implementation
const createUserService = (repo: UserRepository) => ({
  getUser: async (id: string) => {
    const user = await repo.findById(id);
    if (!user) throw new NotFoundError("User", id);
    return user;
  },

  listUsers: async (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    return repo.findAll({ limit, offset });
  },

  createUser: async (input: CreateUserInput) => {
    // business logic here
    return repo.create(input);
  },
});

// Composition root
const userRepo = createPrismaUserRepository(prisma);
const userService = createUserService(userRepo);

// In tests: swap implementation
const mockRepo = createInMemoryUserRepository();
const testService = createUserService(mockRepo);
```
