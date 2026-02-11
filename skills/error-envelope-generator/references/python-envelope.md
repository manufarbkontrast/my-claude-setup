# Python API Envelope - Pydantic + FastAPI

## Pydantic Models

```python
from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    model_config = {"frozen": True}

    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

class PaginationMeta(BaseModel):
    model_config = {"frozen": True}

    total: int
    page: int
    limit: int
    total_pages: int

class PaginatedResponse(ApiResponse[list[T]], Generic[T]):
    metadata: PaginationMeta

class ErrorDetail(BaseModel):
    model_config = {"frozen": True}

    error_code: str
    details: Optional[dict] = None
```

## Helper Functions

```python
import math

def success_response(data: T) -> ApiResponse[T]:
    return ApiResponse(success=True, data=data, error=None)

def error_response(
    message: str,
    error_code: str,
    details: dict | None = None,
) -> ApiResponse[None]:
    return ApiResponse(
        success=False,
        data=None,
        error=message,
        error_code=error_code,
        details=details,
    )

def paginated_response(
    data: list[T],
    total: int,
    page: int,
    limit: int,
) -> PaginatedResponse[T]:
    return PaginatedResponse(
        success=True,
        data=data,
        error=None,
        metadata=PaginationMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=math.ceil(total / limit),
        ),
    )
```

## FastAPI Integration

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/users/{user_id}")
async def get_user(user_id: str) -> ApiResponse[User]:
    user = await user_repo.find_by_id(user_id)
    if not user:
        return error_response("User not found", "NOT_FOUND")
    return success_response(user)

@app.get("/users")
async def list_users(page: int = 1, limit: int = 20) -> PaginatedResponse[User]:
    limit = min(limit, 100)
    items, total = await user_repo.find_all(page=page, limit=limit)
    return paginated_response(items, total, page, limit)

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(exc.detail, "HTTP_ERROR").model_dump(),
    )
```
