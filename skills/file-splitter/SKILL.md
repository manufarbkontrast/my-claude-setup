---
name: file-splitter
description: Analyze large files (>800 lines) and propose splits into smaller, cohesive modules. Detects natural boundaries, suggests file names, and handles import/export rewiring. Use when files exceed size limits or have low cohesion.
version: 1.0.0
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - file splitting
    - refactor
    - cohesion
    - modules
    - file organization
    - code structure
    - large files
    - decomposition
---

# File Splitter

Analyze files exceeding the 800-line limit and propose cohesive splits. Follows the principle: **MANY SMALL FILES > FEW LARGE FILES** with high cohesion and low coupling.

## When to Use

- File exceeds 800 lines (hard limit from coding style rules)
- File has multiple distinct concerns or responsibilities
- File contains multiple classes or large function groups
- Imports section is growing beyond 20+ imports
- Claude auto-detects: files >400 lines during code review

## Workflow

### Step 1: Analyze

Read the file and identify:
1. **Import clusters** — groups of imports that serve different purposes
2. **Export groups** — which exports are used together by consumers
3. **Class boundaries** — each class is a candidate for its own file
4. **Function clusters** — functions that call each other frequently
5. **Type definitions** — interfaces/types that can be extracted
6. **Constants** — configuration values, enums, magic numbers

### Step 2: Identify Split Strategy

Choose the best strategy based on the file's structure:

| Strategy | When to Use | Example |
|----------|------------|---------|
| **By Class** | File has 2+ classes | `user.ts` → `user-entity.ts`, `user-validator.ts` |
| **By Concern** | Mixed responsibilities | `api.ts` → `api-routes.ts`, `api-middleware.ts`, `api-types.ts` |
| **By Export Group** | Consumers use different subsets | `utils.ts` → `string-utils.ts`, `date-utils.ts` |
| **By Layer** | Mixed abstraction levels | `service.ts` → `service.ts`, `service-helpers.ts` |
| **Types Extraction** | 50+ lines of type definitions | `module.ts` → `module.ts`, `module.types.ts` |

### Step 3: Plan the Split

For each proposed new file, document:
- **File name** — descriptive, follows existing naming conventions
- **Contents** — which functions/classes/types move to this file
- **Line count** — target 200-400 lines per file
- **Dependencies** — what this file imports from other new files
- **Exports** — what this file exports

### Step 4: Execute

1. Create new files with extracted code
2. Update imports in the original file
3. Update imports in all consumer files
4. Add barrel export (index.ts) if needed for backwards compatibility
5. Run tests to verify nothing broke

## Split Decision Matrix

```
File has multiple classes?
  YES → Split by class (one class per file)
  NO ↓

File has mixed concerns (data + logic + types)?
  YES → Split by concern
  NO ↓

File has 50+ lines of type definitions?
  YES → Extract types to {name}.types.ts
  NO ↓

File has utility functions used by different consumers?
  YES → Split by export group / consumer
  NO ↓

File has helper functions only used internally?
  YES → Extract to {name}-helpers.ts
  NO → File may be fine as-is; review cohesion
```

## Naming Conventions

| Extracted Content | Naming Pattern | Example |
|-------------------|----------------|---------|
| Types/Interfaces | `{name}.types.ts` | `user.types.ts` |
| Constants/Config | `{name}.constants.ts` | `api.constants.ts` |
| Utilities/Helpers | `{name}-utils.ts` | `string-utils.ts` |
| Validation | `{name}.validation.ts` | `user.validation.ts` |
| Single Class | `{class-name}.ts` | `user-repository.ts` |
| Test helpers | `{name}.test-helpers.ts` | `auth.test-helpers.ts` |

## Import Rewiring

After splitting, update all files that imported from the original:

```typescript
// BEFORE: single large file
import { User, UserValidator, createUser, USER_ROLES } from "./user";

// AFTER: imports from split files
import { User } from "./user.types";
import { UserValidator } from "./user-validator";
import { createUser } from "./user-service";
import { USER_ROLES } from "./user.constants";
```

### Barrel Export Pattern (Optional)

To maintain backwards compatibility during migration:

```typescript
// user/index.ts — re-exports everything
export { User } from "./user.types";
export { UserValidator } from "./user-validator";
export { createUser } from "./user-service";
export { USER_ROLES } from "./user.constants";
```

## Verification Checklist

After splitting, verify:
- [ ] All tests pass (no broken imports)
- [ ] No circular dependencies introduced
- [ ] Each new file is 200-400 lines (target range)
- [ ] Each new file has a single, clear responsibility
- [ ] No duplicate code across split files
- [ ] Barrel export exists if consumers import from the original path
- [ ] TypeScript compiles without errors

## Best Practices

1. **Split types first** — they have no logic dependencies, easiest to extract
2. **One class per file** — unless classes are tightly coupled (e.g., factory + product)
3. **Keep related tests together** — test files mirror source file structure
4. **Don't over-split** — 3 files of 100 lines each is worse than 1 file of 300 lines
5. **Preserve the public API** — use barrel exports to avoid breaking consumers
6. **Run tests after each extraction** — catch issues early

## Common Pitfalls

- **Circular imports** — A imports from B, B imports from A → extract shared types to C
- **Over-splitting** — creating too many tiny files reduces navigability
- **Breaking consumers** — always check which files import from the target
- **Losing context** — split files should still be understandable in isolation
- **Forgetting test updates** — test imports need updating too
