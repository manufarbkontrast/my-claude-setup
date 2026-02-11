# JavaScript/TypeScript Immutable Patterns

## Array Operations

### Adding Items
```typescript
// Append
const appended = [...items, newItem];

// Prepend
const prepended = [newItem, ...items];

// Insert at index
const inserted = [...items.slice(0, idx), newItem, ...items.slice(idx)];
```

### Removing Items
```typescript
// By index
const removed = items.filter((_, i) => i !== idx);

// By value
const removed = items.filter((item) => item.id !== targetId);

// First/Last
const withoutFirst = items.slice(1);
const withoutLast = items.slice(0, -1);
```

### Updating Items
```typescript
// Update at index
const updated = items.map((item, i) => (i === idx ? newItem : item));

// Update by predicate
const updated = items.map((item) =>
  item.id === targetId ? { ...item, name: "new" } : item,
);

// ES2023 Array.prototype.with()
const updated = items.with(idx, newItem);
```

### Sorting & Reversing
```typescript
// ES2023 immutable sort/reverse
const sorted = items.toSorted((a, b) => a.name.localeCompare(b.name));
const reversed = items.toReversed();

// Pre-ES2023 fallback
const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
const reversed = [...items].reverse();
```

## Object Operations

### Updating Fields
```typescript
// Single field
const updated = { ...user, name: "new" };

// Multiple fields
const updated = { ...user, name: "new", email: "new@example.com" };

// Computed property name
const updated = { ...user, [fieldName]: value };
```

### Removing Fields
```typescript
// Destructure to omit
const { password, ...safeUser } = user;

// Dynamic omit
const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, K> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k as K)),
  ) as Omit<T, K>;
};
```

### Deep Updates
```typescript
// Manual nested spread
const updated = {
  ...state,
  user: {
    ...state.user,
    address: {
      ...state.user.address,
      city: "Berlin",
    },
  },
};

// With immer (for complex nested updates)
import { produce } from "immer";
const updated = produce(state, (draft) => {
  draft.user.address.city = "Berlin";
});
```

## Map & Set Operations

```typescript
// Map: add entry
const withEntry = new Map([...map, [key, value]]);

// Map: remove entry
const withoutEntry = new Map([...map].filter(([k]) => k !== key));

// Map: update entry
const updated = new Map([...map].map(([k, v]) => [k, k === key ? newVal : v]));

// Set: add item
const withItem = new Set([...set, item]);

// Set: remove item
const withoutItem = new Set([...set].filter((x) => x !== item));
```

## TypeScript Type Helpers

```typescript
// Shallow readonly
type Immutable<T> = Readonly<T>;

// Deep readonly
type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T extends Set<infer U>
      ? ReadonlySet<DeepReadonly<U>>
      : T extends object
        ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
        : T;

// Readonly array
type ImmutableList<T> = readonly T[];

// Function that doesn't mutate input
type PureFunction<TInput, TOutput> = (input: Readonly<TInput>) => TOutput;
```

## State Management Patterns

### Reducer Pattern (Immutable by Design)
```typescript
type Action =
  | { readonly type: "ADD_ITEM"; readonly item: Item }
  | { readonly type: "REMOVE_ITEM"; readonly id: string }
  | { readonly type: "UPDATE_ITEM"; readonly id: string; readonly data: Partial<Item> };

const reducer = (state: readonly Item[], action: Action): readonly Item[] => {
  switch (action.type) {
    case "ADD_ITEM":
      return [...state, action.item];
    case "REMOVE_ITEM":
      return state.filter((item) => item.id !== action.id);
    case "UPDATE_ITEM":
      return state.map((item) =>
        item.id === action.id ? { ...item, ...action.data } : item,
      );
  }
};
```
