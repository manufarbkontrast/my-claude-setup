# Python Immutable Patterns

## Frozen Dataclasses

```python
from dataclasses import dataclass, replace

@dataclass(frozen=True)
class User:
    id: str
    name: str
    email: str

# Create
user = User(id="1", name="Alice", email="alice@example.com")

# Update (returns new instance)
updated = replace(user, name="Bob")

# Original is unchanged
assert user.name == "Alice"
assert updated.name == "Bob"
```

## Tuple Instead of List

```python
# WRONG: mutable list
items = [1, 2, 3]
items.append(4)  # mutates

# CORRECT: immutable tuple
items = (1, 2, 3)
new_items = (*items, 4)  # new tuple
```

## FrozenSet Instead of Set

```python
# WRONG: mutable set
tags = {"python", "coding"}
tags.add("immutable")  # mutates

# CORRECT: immutable frozenset
tags = frozenset({"python", "coding"})
new_tags = tags | {"immutable"}  # new frozenset
```

## Dictionary Operations

```python
# WRONG: mutation
user = {"name": "Alice", "age": 30}
user["age"] = 31  # mutates

# CORRECT: new dict
user = {"name": "Alice", "age": 30}
updated = {**user, "age": 31}  # new dict

# Remove key (new dict)
without_age = {k: v for k, v in user.items() if k != "age"}
```

## List Operations (Immutable)

```python
# Append
new_list = [*old_list, new_item]

# Prepend
new_list = [new_item, *old_list]

# Remove by index
new_list = [*old_list[:idx], *old_list[idx + 1:]]

# Remove by value
new_list = [x for x in old_list if x != target]

# Update at index
new_list = [new_val if i == idx else x for i, x in enumerate(old_list)]

# Sort (already immutable)
sorted_list = sorted(old_list, key=lambda x: x.name)

# Reverse (already immutable)
reversed_list = list(reversed(old_list))
```

## NamedTuple for Immutable Records

```python
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

p = Point(1.0, 2.0)
moved = Point(p.x + 1, p.y)  # new instance
# p.x = 5  # TypeError: immutable
```

## Pydantic with Frozen Models

```python
from pydantic import BaseModel

class User(BaseModel):
    model_config = {"frozen": True}

    id: str
    name: str
    email: str

user = User(id="1", name="Alice", email="a@b.com")

# Update returns new model
updated = user.model_copy(update={"name": "Bob"})
```

## MappingProxyType for Read-Only Dicts

```python
from types import MappingProxyType

config = MappingProxyType({
    "host": "localhost",
    "port": 8080,
})

# config["host"] = "remote"  # TypeError: immutable
```

## Common Pitfalls

- **Default mutable arguments**: `def f(lst=[])` shares state across calls → use `def f(lst=None)`
- **Shallow copy**: `dict.copy()` and `list.copy()` only copy top level
- **`@dataclass` without `frozen=True`**: still mutable by default
- **`tuple` of mutable objects**: the tuple is immutable, but its contents may not be
