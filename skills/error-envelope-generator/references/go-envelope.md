# Go API Envelope - Structs + Framework Integration

## Core Structs

```go
package response

import "math"

type ApiResponse[T any] struct {
    Success bool   `json:"success"`
    Data    *T     `json:"data"`
    Error   string `json:"error,omitempty"`
}

type PaginationMeta struct {
    Total      int `json:"total"`
    Page       int `json:"page"`
    Limit      int `json:"limit"`
    TotalPages int `json:"totalPages"`
}

type PaginatedResponse[T any] struct {
    Success  bool           `json:"success"`
    Data     []T            `json:"data"`
    Error    string         `json:"error,omitempty"`
    Metadata PaginationMeta `json:"metadata"`
}

type ErrorResponse struct {
    Success   bool   `json:"success"`
    Data      any    `json:"data"`
    Error     string `json:"error"`
    ErrorCode string `json:"errorCode"`
    Details   any    `json:"details,omitempty"`
}
```

## Helper Functions

```go
func Success[T any](data T) ApiResponse[T] {
    return ApiResponse[T]{
        Success: true,
        Data:    &data,
    }
}

func Error(message, errorCode string) ErrorResponse {
    return ErrorResponse{
        Success:   false,
        Data:      nil,
        Error:     message,
        ErrorCode: errorCode,
    }
}

func Paginated[T any](data []T, total, page, limit int) PaginatedResponse[T] {
    return PaginatedResponse[T]{
        Success: true,
        Data:    data,
        Metadata: PaginationMeta{
            Total:      total,
            Page:       page,
            Limit:      limit,
            TotalPages: int(math.Ceil(float64(total) / float64(limit))),
        },
    }
}
```

## Gin Integration

```go
import "github.com/gin-gonic/gin"

func GetUser(c *gin.Context) {
    id := c.Param("id")
    user, err := userRepo.FindByID(c, id)
    if err != nil {
        c.JSON(404, Error("User not found", "NOT_FOUND"))
        return
    }
    c.JSON(200, Success(user))
}

func ListUsers(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
    if limit > 100 {
        limit = 100
    }
    items, total, err := userRepo.FindAll(c, page, limit)
    if err != nil {
        c.JSON(500, Error("Internal error", "INTERNAL_ERROR"))
        return
    }
    c.JSON(200, Paginated(items, total, page, limit))
}
```

## Echo Integration

```go
import "github.com/labstack/echo/v4"

func GetUser(c echo.Context) error {
    id := c.Param("id")
    user, err := userRepo.FindByID(c.Request().Context(), id)
    if err != nil {
        return c.JSON(404, Error("User not found", "NOT_FOUND"))
    }
    return c.JSON(200, Success(user))
}
```
