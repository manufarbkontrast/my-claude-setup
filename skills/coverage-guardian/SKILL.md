---
name: coverage-guardian
description: Analyze test coverage reports, identify gaps below the 80% threshold, and suggest specific tests for uncovered code paths. Supports Istanbul/c8, pytest-cov, and go cover. Use when checking test coverage or identifying missing tests.
version: 1.0.0
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - test coverage
    - testing
    - coverage report
    - gap analysis
    - unit tests
    - 80 percent
    - istanbul
    - pytest
    - go cover
    - uncovered lines
---

# Coverage Guardian

Analyze test coverage and identify gaps below the mandatory 80% threshold. Suggests specific tests needed for uncovered code paths.

## When to Use

- After running tests to check coverage status
- Before commits to verify coverage requirements
- When adding new code to ensure tests cover it
- Claude auto-detects: when coverage drops below 80%

## Workflow

### Step 1: Detect Framework

Identify the test framework by checking for config files:

| Framework | Config Files | Coverage Command |
|-----------|-------------|-----------------|
| Jest | `jest.config.*`, `package.json` | `npx jest --coverage` |
| Vitest | `vitest.config.*`, `vite.config.*` | `npx vitest --coverage` |
| pytest | `pyproject.toml`, `pytest.ini`, `setup.cfg` | `pytest --cov --cov-report=json` |
| Go | `go.mod` | `go test -coverprofile=coverage.out ./...` |
| c8/nyc | `package.json`, `.nycrc` | `npx c8 report --reporter=json` |

### Step 2: Run Coverage

Execute the appropriate coverage command and parse the output.

### Step 3: Analyze Gaps

For each file below 80% coverage:

1. **Identify uncovered lines** — which specific lines/branches lack tests
2. **Categorize the gap** — what type of code is uncovered:
   - Error handling paths
   - Edge cases / boundary conditions
   - Alternate branches (if/else, switch cases)
   - Integration points (API calls, DB queries)
   - Utility functions
3. **Prioritize** — rank by importance:
   - CRITICAL: Business logic, authentication, payment processing
   - HIGH: Error handling, validation, data transformation
   - MEDIUM: Utility functions, formatters, helpers
   - LOW: Logging, debug code, simple getters/setters

### Step 4: Generate Test Suggestions

For each uncovered path, suggest a specific test:

```
File: src/services/user-service.ts (62% coverage)
Gap: Lines 45-52 — error handling when user not found
Suggested test:
  describe("getUser")
    it("should throw NotFoundError when user does not exist")
    → Call getUser with non-existent ID
    → Assert NotFoundError is thrown
    → Assert error message contains the ID
```

## Report Format

```
COVERAGE GUARDIAN REPORT
========================

Overall Coverage: 74.2% (target: 80%) ❌

Files Below Threshold:
┌─────────────────────────────────┬──────────┬──────────┬──────────┐
│ File                            │ Lines    │ Branches │ Functions│
├─────────────────────────────────┼──────────┼──────────┼──────────┤
│ src/services/user-service.ts    │ 62.3%  ❌│ 45.0%  ❌│ 75.0%    │
│ src/middleware/auth.ts          │ 71.4%  ❌│ 60.0%  ❌│ 80.0%    │
│ src/utils/validator.ts          │ 78.9%  ❌│ 70.0%  ❌│ 85.0%    │
└─────────────────────────────────┴──────────┴──────────┴──────────┘

Top Priority Tests Needed:
1. [CRITICAL] user-service.ts:45-52 — Error path: user not found
2. [CRITICAL] auth.ts:23-31 — Token expiration handling
3. [HIGH] auth.ts:35-40 — Invalid token format
4. [HIGH] user-service.ts:68-75 — Duplicate email validation
5. [MEDIUM] validator.ts:15-20 — Empty string edge case

Tests to Write: 5 (estimated to bring coverage to 83.1%)
```

## Coverage Metrics

Track four coverage dimensions:

| Metric | What It Measures | 80% Target Applies |
|--------|-----------------|-------------------|
| **Line Coverage** | % of executed lines | Yes |
| **Branch Coverage** | % of taken branches (if/else/switch) | Yes |
| **Function Coverage** | % of called functions | Yes |
| **Statement Coverage** | % of executed statements | Informational |

## Gap Categorization

### Error Handling Gaps (Most Common)
```typescript
// Uncovered: the catch block
try {
  const user = await db.findUser(id);
  return user;
} catch (error) {
  // ← This path needs a test
  throw new DatabaseError("Failed to fetch user", { cause: error });
}
```

**Test suggestion:**
```typescript
it("should throw DatabaseError when database fails", async () => {
  db.findUser.mockRejectedValue(new Error("Connection lost"));
  await expect(getUser("123")).rejects.toThrow(DatabaseError);
});
```

### Branch Gaps
```typescript
// Uncovered: the else branch
function formatName(user: User): string {
  if (user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else {
    // ← This path needs a test
    return user.firstName;
  }
}
```

### Edge Case Gaps
```typescript
// Uncovered: empty array, null input
function getFirst<T>(items: readonly T[]): T | null {
  return items[0] ?? null; // ← Test with empty array
}
```

## Integration with TDD Workflow

1. Run `/coverage-guardian` to identify gaps
2. For each gap, use `tdd-guide` agent:
   - Write the failing test (RED)
   - Implement or fix the code (GREEN)
   - Refactor if needed (IMPROVE)
3. Re-run `/coverage-guardian` to verify improvement
4. Repeat until 80%+ reached

## Best Practices

1. **Focus on branch coverage** — line coverage can be misleading; branches reveal untested logic paths
2. **Prioritize business logic** — 100% coverage on validators matters more than 100% on formatters
3. **Don't chase 100%** — diminishing returns above 90%; focus on meaningful tests
4. **Test behavior, not implementation** — coverage is a proxy metric, not the goal
5. **Use coverage trends** — track coverage over time, not just absolute numbers

## Common Pitfalls

- **Coverage without assertions** — tests that execute code but don't assert behavior
- **Testing implementation details** — brittle tests that break on refactor
- **Ignoring branch coverage** — 90% line coverage with 40% branch coverage is risky
- **Gaming the metric** — writing trivial tests just to hit the number
- **Untestable code** — if code is hard to test, it probably needs refactoring
