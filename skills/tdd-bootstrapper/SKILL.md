---
name: tdd-bootstrapper
description: Initialize complete TDD setup for a new feature. Creates test file structure, writes initial failing tests, sets up coverage tracking, and enforces RED-GREEN-REFACTOR workflow. Use when starting new features or components with test-driven development.
version: 1.0.0
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - tdd
    - test driven development
    - red green refactor
    - testing
    - unit tests
    - integration tests
    - e2e tests
    - coverage
    - test first
---

# TDD Bootstrapper

Initialize a complete Test-Driven Development setup for a new feature. Creates test files, writes initial failing tests, and enforces the RED-GREEN-REFACTOR workflow.

## When to Use

- Starting a new feature or component
- Adding a new API endpoint
- Creating a new service or utility
- Any new code that needs tests (which is all code)

## Usage

Invoke with: `/tdd-bootstrapper <feature-name> [--type=unit|integration|e2e|all]`

Arguments:
- `feature-name`: Descriptive name of the feature (e.g., `user-registration`, `cart-checkout`)
- `--type`: Test types to generate (default: `all`)

## Workflow

### Phase 1: Feature Analysis

1. **Identify testable units** from the feature description:
   - Functions / methods
   - API endpoints
   - User interactions
   - Data transformations
   - Error scenarios

2. **Map the test pyramid:**
   ```
        /  E2E  \        ← Few: critical user flows
       /----------\
      / Integration \     ← Some: API + DB + services
     /--------------\
    /   Unit Tests    \   ← Many: functions, logic, utils
   /==================\
   ```

3. **List all test cases** before writing any code.

### Phase 2: Create Test Structure

Generate test files following project conventions:

**TypeScript/JavaScript:**
```
src/
  features/
    user-registration/
      __tests__/
        user-registration.test.ts       # Unit tests
        user-registration.integration.ts # Integration tests
      user-registration.ts              # (empty - to be implemented)
      user-registration.types.ts        # Types (if needed)

e2e/
  user-registration.spec.ts             # E2E tests
```

**Python:**
```
src/
  features/
    user_registration/
      __init__.py
      user_registration.py              # (empty)
      test_user_registration.py         # Unit tests
      test_user_registration_integration.py  # Integration

tests/
  e2e/
    test_user_registration_e2e.py       # E2E tests
```

**Go:**
```
internal/
  user_registration/
    user_registration.go                # (empty)
    user_registration_test.go           # Unit tests
    user_registration_integration_test.go # Integration
```

### Phase 3: Write Failing Tests (RED)

Write tests FIRST, before any implementation:

```typescript
// __tests__/user-registration.test.ts

describe("UserRegistration", () => {
  describe("registerUser", () => {
    it("should create a new user with valid input", async () => {
      const input = {
        name: "Alice",
        email: "alice@example.com",
        password: "SecurePass123!",
      };

      const result = await registerUser(input);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("Alice");
      expect(result.email).toBe("alice@example.com");
      expect(result).not.toHaveProperty("password");
    });

    it("should reject duplicate email", async () => {
      const input = { name: "Bob", email: "existing@example.com", password: "Pass123!" };

      await expect(registerUser(input)).rejects.toThrow("Email already exists");
    });

    it("should reject weak password", async () => {
      const input = { name: "Charlie", email: "c@example.com", password: "123" };

      await expect(registerUser(input)).rejects.toThrow("Password too weak");
    });

    it("should reject invalid email format", async () => {
      const input = { name: "Dave", email: "not-an-email", password: "SecurePass123!" };

      await expect(registerUser(input)).rejects.toThrow("Invalid email");
    });

    it("should hash the password before storing", async () => {
      const input = { name: "Eve", email: "eve@example.com", password: "SecurePass123!" };

      const result = await registerUser(input);
      const stored = await userRepo.findById(result.id);

      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.passwordHash).not.toBe("SecurePass123!");
    });
  });
});
```

### Phase 4: Verify RED

Run the tests and confirm they ALL FAIL:

```bash
# Expected output: ALL tests should FAIL
npx jest --testPathPattern=user-registration
# 5 tests, 5 failures ✓ (RED confirmed)
```

If any test passes before implementation, it's testing the wrong thing.

### Phase 5: Implement (GREEN)

Now implement the minimum code to make tests pass. Use the `tdd-guide` agent for guidance:

1. Make one test pass at a time
2. Write the simplest possible implementation
3. Re-run tests after each change
4. Stop when all tests pass

### Phase 6: Refactor (IMPROVE)

With all tests green:
1. Remove duplication
2. Improve naming
3. Extract helpers
4. Apply immutable patterns
5. Re-run tests — they must stay green

### Phase 7: Coverage Check

Run `coverage-guardian` to verify 80%+ coverage:

```bash
npx jest --coverage --testPathPattern=user-registration
```

## Test Case Generation Template

For any feature, generate tests for these categories:

| Category | Examples |
|----------|---------|
| **Happy path** | Valid input → expected output |
| **Validation errors** | Invalid input → specific error |
| **Edge cases** | Empty input, null, boundary values |
| **Error handling** | DB failure, network error, timeout |
| **Security** | Injection attempts, unauthorized access |
| **Concurrency** | Duplicate requests, race conditions |

## Test Writing Rules

1. **One assertion per test** (preferred) — makes failures obvious
2. **Descriptive names** — `should reject duplicate email` not `test3`
3. **AAA pattern** — Arrange, Act, Assert in every test
4. **Isolated tests** — no test depends on another test's state
5. **Immutable test data** — create fresh fixtures per test, never share mutable state
6. **Mock at boundaries** — mock external services, not internal functions

## Integration with Agents

- **`tdd-guide` agent** — use during GREEN and IMPROVE phases for guidance
- **`coverage-guardian` skill** — use after IMPROVE phase to verify coverage
- **`code-reviewer` agent** — use after all phases complete for quality review

## Best Practices

1. **Write all test cases in Phase 3** before starting implementation
2. **Keep tests fast** — unit tests <100ms each, integration <1s
3. **Test behavior, not implementation** — tests should survive refactoring
4. **Use test doubles wisely** — prefer stubs over mocks, mocks over spies
5. **Name tests as specifications** — they document the feature's behavior

## Common Pitfalls

- **Writing tests after code** — defeats the purpose of TDD
- **Too many mocks** — if you need 10 mocks, the code needs refactoring
- **Testing private methods** — test through the public API
- **Fragile tests** — tests that break when implementation changes
- **Skipping the RED phase** — always verify tests fail first

## When to Load References

- For Jest/Vitest boilerplate → `references/jest-setup.md`
- For pytest boilerplate → `references/pytest-setup.md`
- For Go testing boilerplate → `references/go-test-setup.md`
