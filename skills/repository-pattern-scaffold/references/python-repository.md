# Python Repository Pattern - SQLAlchemy + Pydantic

## Abstract Repository

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional

T = TypeVar("T")
CreateT = TypeVar("CreateT")
UpdateT = TypeVar("UpdateT")

class Repository(ABC, Generic[T, CreateT, UpdateT]):
    @abstractmethod
    async def find_all(
        self, *, limit: int = 50, offset: int = 0
    ) -> list[T]: ...

    @abstractmethod
    async def find_by_id(self, id: str) -> Optional[T]: ...

    @abstractmethod
    async def create(self, data: CreateT) -> T: ...

    @abstractmethod
    async def update(self, id: str, data: UpdateT) -> T: ...

    @abstractmethod
    async def delete(self, id: str) -> None: ...
```

## Pydantic Models

```python
from datetime import datetime
from pydantic import BaseModel

class User(BaseModel):
    model_config = {"frozen": True}

    id: str
    name: str
    email: str
    created_at: datetime
    updated_at: datetime

class CreateUserInput(BaseModel):
    model_config = {"frozen": True}

    name: str
    email: str

class UpdateUserInput(BaseModel):
    model_config = {"frozen": True}

    name: str | None = None
    email: str | None = None
```

## SQLAlchemy Implementation

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sa_delete
import uuid
from datetime import datetime, timezone

class SqlAlchemyUserRepository(Repository[User, CreateUserInput, UpdateUserInput]):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def find_all(self, *, limit: int = 50, offset: int = 0) -> list[User]:
        stmt = select(UserModel).limit(limit).offset(offset)
        result = await self._session.execute(stmt)
        return [self._to_domain(row) for row in result.scalars().all()]

    async def find_by_id(self, id: str) -> User | None:
        stmt = select(UserModel).where(UserModel.id == id)
        result = await self._session.execute(stmt)
        row = result.scalar_one_or_none()
        return self._to_domain(row) if row else None

    async def create(self, data: CreateUserInput) -> User:
        now = datetime.now(timezone.utc)
        model = UserModel(
            id=str(uuid.uuid4()),
            name=data.name,
            email=data.email,
            created_at=now,
            updated_at=now,
        )
        self._session.add(model)
        await self._session.flush()
        return self._to_domain(model)

    async def update(self, id: str, data: UpdateUserInput) -> User:
        stmt = select(UserModel).where(UserModel.id == id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if not model:
            raise ValueError(f"User not found: {id}")
        updates = data.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(model, field, value)
        model.updated_at = datetime.now(timezone.utc)
        await self._session.flush()
        return self._to_domain(model)

    async def delete(self, id: str) -> None:
        stmt = sa_delete(UserModel).where(UserModel.id == id)
        result = await self._session.execute(stmt)
        if result.rowcount == 0:
            raise ValueError(f"User not found: {id}")

    @staticmethod
    def _to_domain(model: UserModel) -> User:
        return User(
            id=model.id,
            name=model.name,
            email=model.email,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
```

## In-Memory Implementation (for Tests)

```python
import uuid
from datetime import datetime, timezone

class InMemoryUserRepository(Repository[User, CreateUserInput, UpdateUserInput]):
    def __init__(self):
        self._store: tuple[User, ...] = ()

    async def find_all(self, *, limit: int = 50, offset: int = 0) -> list[User]:
        return list(self._store[offset:offset + limit])

    async def find_by_id(self, id: str) -> User | None:
        return next((u for u in self._store if u.id == id), None)

    async def create(self, data: CreateUserInput) -> User:
        now = datetime.now(timezone.utc)
        user = User(
            id=str(uuid.uuid4()),
            name=data.name,
            email=data.email,
            created_at=now,
            updated_at=now,
        )
        self._store = (*self._store, user)  # immutable append
        return user

    async def update(self, id: str, data: UpdateUserInput) -> User:
        existing = await self.find_by_id(id)
        if not existing:
            raise ValueError(f"User not found: {id}")
        updates = data.model_dump(exclude_unset=True)
        updated = existing.model_copy(update={
            **updates,
            "updated_at": datetime.now(timezone.utc),
        })
        self._store = tuple(
            updated if u.id == id else u for u in self._store
        )  # immutable update
        return updated

    async def delete(self, id: str) -> None:
        if not any(u.id == id for u in self._store):
            raise ValueError(f"User not found: {id}")
        self._store = tuple(u for u in self._store if u.id != id)  # immutable delete
```
