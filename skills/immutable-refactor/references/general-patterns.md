# General Immutability Principles

## Core Rules

1. **Never modify input parameters** — always return new values
2. **No side effects in pure functions** — same input → same output
3. **Copy-on-write** — when mutation is needed for performance, copy first
4. **Structural sharing** — reuse unchanged parts of data structures

## Detection Checklist

When reviewing code for mutability issues, look for:

- [ ] Direct property assignment on parameters (`param.field = value`)
- [ ] In-place collection methods (`push`, `pop`, `splice`, `sort`, `reverse`)
- [ ] `delete` operator on objects
- [ ] Loop-based accumulation modifying external state
- [ ] Mutable default parameters (Python: `def f(lst=[])`)
- [ ] Void/unit return types that modify state (setters)
- [ ] Pointer/reference receivers that modify struct fields

## When Mutation Is Acceptable

Mutation is acceptable in **local scope only**:

```
// OK: local mutation (not visible outside function)
function sum(numbers: readonly number[]): number {
  let total = 0;  // local mutable variable
  for (const n of numbers) {
    total += n;
  }
  return total;
}
```

Mutation is NOT acceptable when:
- The data is passed in as a parameter
- The data is shared between multiple callers
- The data is stored in global/module state
- The function is expected to be pure

## Refactoring Strategy

### Step 1: Identify the Mutation Boundary
- Which variable is being mutated?
- Where is it defined? (parameter, local, global)
- Who else has a reference to it?

### Step 2: Choose the Immutable Alternative
- **Spread/copy**: Simple updates → `{ ...obj, field: newVal }`
- **Map/filter**: Collection transforms → `items.map(transform)`
- **Reduce**: Accumulation → `items.reduce(accumulator, initial)`
- **Frozen types**: Enforce at type level → `Readonly<T>`, `frozen=True`

### Step 3: Verify
- Run all tests — behavior should be identical
- Check for reference equality assumptions (code that checks `===` on objects)
- Verify performance — immutable operations may allocate more

## Performance Considerations

- **Small objects**: Spread/copy is fast; no optimization needed
- **Large arrays (10K+)**: Consider persistent data structures (Immutable.js, pyrsistent)
- **Hot paths**: Profile first — premature optimization is worse than clear immutable code
- **Structural sharing**: Libraries like Immer use proxies to minimize copying

## Language-Specific Enforcement

| Language | Type-Level | Runtime |
|----------|-----------|---------|
| TypeScript | `Readonly<T>`, `readonly` | `Object.freeze()` |
| Python | `frozen=True`, `NamedTuple` | `MappingProxyType` |
| Go | Value receivers | No built-in (convention) |
| Rust | Default immutable | `mut` keyword for opt-in mutation |
| Java | `final`, `record` | `Collections.unmodifiable*()` |
