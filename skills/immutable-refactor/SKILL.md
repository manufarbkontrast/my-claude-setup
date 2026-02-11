---
name: immutable-refactor
description: Detect mutable code patterns and refactor to immutable alternatives across JavaScript/TypeScript, Python, and Go. Use when reviewing code for mutation, refactoring existing mutable code, or enforcing immutability rules.
version: 1.0.0
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - immutable
    - immutability
    - refactor
    - mutation
    - pure functions
    - side effects
    - functional programming
    - spread operator
    - copy-on-write
    - frozen
---

# Immutable Refactor

Detect and refactor mutable code patterns into immutable alternatives. Follows the core principle: **ALWAYS create new objects, NEVER mutate existing ones.**

## When to Use

- Code review reveals in-place mutations
- Refactoring existing mutable code to prevent side effects
- Enforcing immutability rules from `coding-style.md`
- Debugging issues caused by shared mutable state

## Workflow

1. **Detect** - Scan for mutation patterns
2. **Preview** - Show before/after for each change
3. **Apply** - Refactor to immutable alternatives
4. **Verify** - Run tests to confirm behavior unchanged

## Detection Patterns

### JavaScript / TypeScript

| Mutable Pattern | Immutable Alternative |
|----------------|----------------------|
| `arr.push(item)` | `[...arr, item]` |
| `arr.splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` |
| `arr.sort()` | `[...arr].sort()` or `arr.toSorted()` |
| `arr.reverse()` | `[...arr].reverse()` or `arr.toReversed()` |
| `arr[i] = val` | `arr.with(i, val)` or `arr.map(...)` |
| `obj.key = val` | `{ ...obj, key: val }` |
| `Object.assign(obj, ...)` | `{ ...obj, ...source }` (new object) |
| `delete obj.key` | `const { key, ...rest } = obj` |
| `map.set(k, v)` | `new Map([...map, [k, v]])` |

**Detection regex patterns:**
```
\.push\(          # Array push
\.splice\(        # Array splice
\.sort\(\)        # In-place sort (no toSorted)
\.reverse\(\)     # In-place reverse
Object\.assign\(  # Object.assign with mutation target
delete\s+\w+\.    # Property deletion
\.\w+\s*=\s*      # Direct property assignment (context-dependent)
```

### JavaScript Examples

**Array mutation → Immutable:**
```typescript
// WRONG: mutates original
function addItem(items: Item[], newItem: Item): Item[] {
  items.push(newItem);
  return items;
}

// CORRECT: returns new array
function addItem(items: readonly Item[], newItem: Item): readonly Item[] {
  return [...items, newItem];
}
```

**Object mutation → Immutable:**
```typescript
// WRONG: mutates original
function updateUser(user: User, name: string): User {
  user.name = name;
  return user;
}

// CORRECT: returns new object
function updateUser(user: Readonly<User>, name: string): User {
  return { ...user, name };
}
```

**Nested object mutation → Immutable:**
```typescript
// WRONG: deep mutation
function updateAddress(user: User, city: string): User {
  user.address.city = city;
  return user;
}

// CORRECT: immutable nested update
function updateAddress(user: Readonly<User>, city: string): User {
  return {
    ...user,
    address: { ...user.address, city },
  };
}
```

**Array removal → Immutable:**
```typescript
// WRONG: splice mutates
function removeAt(items: Item[], index: number): Item[] {
  items.splice(index, 1);
  return items;
}

// CORRECT: filter creates new array
function removeAt(items: readonly Item[], index: number): readonly Item[] {
  return items.filter((_, i) => i !== index);
}
```

**Map/Set mutation → Immutable:**
```typescript
// WRONG: mutates map
function addEntry(map: Map<string, number>, key: string, val: number) {
  map.set(key, val);
  return map;
}

// CORRECT: new map
function addEntry(map: ReadonlyMap<string, number>, key: string, val: number) {
  return new Map([...map, [key, val]]);
}
```

### Python

| Mutable Pattern | Immutable Alternative |
|----------------|----------------------|
| `list.append(x)` | `[*lst, x]` |
| `list.extend(other)` | `[*lst, *other]` |
| `dict[key] = val` | `{**d, key: val}` |
| `dict.update(other)` | `{**d, **other}` |
| `del dict[key]` | `{k: v for k, v in d.items() if k != key}` |
| `list.sort()` | `sorted(lst)` |
| `list.reverse()` | `list(reversed(lst))` |
| `set.add(x)` | `s \| {x}` |
| Mutable class | `@dataclass(frozen=True)` |

### Go

| Mutable Pattern | Immutable Alternative |
|----------------|----------------------|
| `slice = append(slice, x)` | Return new slice from function |
| `struct.Field = val` | Return new struct with updated field |
| `map[key] = val` | Create new map with entry |
| Pointer receiver mutation | Value receiver + return new value |

```go
// WRONG: mutates via pointer receiver
func (u *User) SetName(name string) {
    u.Name = name
}

// CORRECT: returns new value
func (u User) WithName(name string) User {
    return User{
        Name:  name,
        Email: u.Email,
        Age:   u.Age,
    }
}
```

## TypeScript Immutability Helpers

Leverage TypeScript's type system to enforce immutability at compile time:

```typescript
// Use Readonly<T> for shallow immutability
type ImmutableUser = Readonly<User>;

// Use readonly arrays
type ImmutableList = readonly Item[];

// Use ReadonlyMap / ReadonlySet
type ImmutableMap = ReadonlyMap<string, number>;

// Deep readonly utility
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

## Best Practices

1. **Prefer `readonly` modifier** in TypeScript interfaces and function parameters
2. **Use `as const`** for literal type narrowing and immutable tuples
3. **Use `Object.freeze()`** sparingly — prefer structural immutability via types
4. **Avoid `let`** — prefer `const` for all variable declarations
5. **Use array methods** that return new arrays: `map`, `filter`, `reduce`, `flatMap`, `toSorted`, `toReversed`, `with`
6. **For deep updates**, consider libraries like `immer` for complex nested structures

## Common Pitfalls

- **Spread is shallow** — `{ ...obj }` only copies top level; nested objects are still shared
- **`Object.freeze` is shallow** — nested objects remain mutable
- **`Array.from()` creates shallow copy** — same concern for nested arrays
- **Confusing `sort()` with `toSorted()`** — `sort()` mutates, `toSorted()` (ES2023) returns new
- **Default parameters** — mutable defaults in Python (`def f(lst=[])`) cause shared state bugs

## When to Load References

- For comprehensive JavaScript/TypeScript patterns → `references/javascript-patterns.md`
- For Python-specific immutable patterns → `references/python-patterns.md`
- For language-agnostic principles → `references/general-patterns.md`
