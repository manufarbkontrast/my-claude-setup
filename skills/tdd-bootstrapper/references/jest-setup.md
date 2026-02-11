# Jest / Vitest TDD Setup

## Jest Configuration

```typescript
// jest.config.ts
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.types.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

## Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("FeatureName", () => {
  // Arrange: shared setup
  let sut: FeatureUnderTest; // system under test

  beforeEach(() => {
    sut = createFeature();
  });

  describe("methodName", () => {
    it("should do expected behavior with valid input", () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = sut.methodName(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it("should throw SpecificError when input is invalid", () => {
      // Arrange
      const input = createInvalidInput();

      // Act & Assert
      expect(() => sut.methodName(input)).toThrow(SpecificError);
    });

    it("should handle edge case: empty input", () => {
      // Arrange
      const input = createEmptyInput();

      // Act
      const result = sut.methodName(input);

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

## Mocking Patterns

```typescript
// Mock a module
vi.mock("./user-repository", () => ({
  createUserRepository: vi.fn(() => ({
    findById: vi.fn(),
    create: vi.fn(),
  })),
}));

// Mock a function
const mockFindById = vi.fn();
const repo = { findById: mockFindById } as unknown as UserRepository;

// Setup mock return values
mockFindById.mockResolvedValue({ id: "1", name: "Alice" });
mockFindById.mockRejectedValue(new Error("Not found"));

// Verify calls
expect(mockFindById).toHaveBeenCalledWith("1");
expect(mockFindById).toHaveBeenCalledTimes(1);
```

## Test Factory Pattern (Immutable)

```typescript
const createUser = (overrides?: Partial<User>): User => ({
  id: "default-id",
  name: "Default Name",
  email: "default@example.com",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

// Usage in tests
const user = createUser({ name: "Custom Name" });
const admin = createUser({ name: "Admin", role: "admin" });
```
