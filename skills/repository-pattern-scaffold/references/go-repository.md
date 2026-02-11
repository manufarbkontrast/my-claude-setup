# Go Repository Pattern - Interface + GORM/sqlx

## Interface Definition

```go
package repository

import "context"

type UserRepository interface {
    FindAll(ctx context.Context, opts QueryOptions) ([]User, error)
    FindByID(ctx context.Context, id string) (*User, error)
    Create(ctx context.Context, input CreateUserInput) (User, error)
    Update(ctx context.Context, id string, input UpdateUserInput) (User, error)
    Delete(ctx context.Context, id string) error
}

type QueryOptions struct {
    Limit   int
    Offset  int
    OrderBy string
    Order   string // "asc" or "desc"
}

type User struct {
    ID        string
    Name      string
    Email     string
    CreatedAt time.Time
    UpdatedAt time.Time
}

type CreateUserInput struct {
    Name  string
    Email string
}

type UpdateUserInput struct {
    Name  *string
    Email *string
}
```

## GORM Implementation

```go
package repository

import (
    "context"
    "time"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type gormUserRepository struct {
    db *gorm.DB
}

func NewGORMUserRepository(db *gorm.DB) UserRepository {
    return &gormUserRepository{db: db}
}

func (r *gormUserRepository) FindAll(ctx context.Context, opts QueryOptions) ([]User, error) {
    if opts.Limit == 0 {
        opts.Limit = 50
    }
    if opts.OrderBy == "" {
        opts.OrderBy = "created_at"
    }
    if opts.Order == "" {
        opts.Order = "desc"
    }

    var users []User
    err := r.db.WithContext(ctx).
        Order(opts.OrderBy + " " + opts.Order).
        Limit(opts.Limit).
        Offset(opts.Offset).
        Find(&users).Error
    return users, err
}

func (r *gormUserRepository) FindByID(ctx context.Context, id string) (*User, error) {
    var user User
    err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
    if err == gorm.ErrRecordNotFound {
        return nil, nil
    }
    return &user, err
}

func (r *gormUserRepository) Create(ctx context.Context, input CreateUserInput) (User, error) {
    now := time.Now()
    user := User{
        ID:        uuid.New().String(),
        Name:      input.Name,
        Email:     input.Email,
        CreatedAt: now,
        UpdatedAt: now,
    }
    err := r.db.WithContext(ctx).Create(&user).Error
    return user, err
}

func (r *gormUserRepository) Update(ctx context.Context, id string, input UpdateUserInput) (User, error) {
    existing, err := r.FindByID(ctx, id)
    if err != nil {
        return User{}, err
    }
    if existing == nil {
        return User{}, fmt.Errorf("user not found: %s", id)
    }

    updates := map[string]interface{}{
        "updated_at": time.Now(),
    }
    if input.Name != nil {
        updates["name"] = *input.Name
    }
    if input.Email != nil {
        updates["email"] = *input.Email
    }

    err = r.db.WithContext(ctx).Model(&User{}).Where("id = ?", id).Updates(updates).Error
    if err != nil {
        return User{}, err
    }

    updated, err := r.FindByID(ctx, id)
    return *updated, err
}

func (r *gormUserRepository) Delete(ctx context.Context, id string) error {
    result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&User{})
    if result.RowsAffected == 0 {
        return fmt.Errorf("user not found: %s", id)
    }
    return result.Error
}
```

## In-Memory Implementation (for Tests)

```go
package repository

import (
    "context"
    "fmt"
    "time"

    "github.com/google/uuid"
)

type inMemoryUserRepository struct {
    store []User // local only, never shared
}

func NewInMemoryUserRepository() UserRepository {
    return &inMemoryUserRepository{store: []User{}}
}

func (r *inMemoryUserRepository) FindAll(_ context.Context, opts QueryOptions) ([]User, error) {
    limit := opts.Limit
    if limit == 0 {
        limit = 50
    }
    end := opts.Offset + limit
    if end > len(r.store) {
        end = len(r.store)
    }
    if opts.Offset >= len(r.store) {
        return []User{}, nil
    }
    // Return copy to prevent external mutation
    result := make([]User, end-opts.Offset)
    copy(result, r.store[opts.Offset:end])
    return result, nil
}

func (r *inMemoryUserRepository) FindByID(_ context.Context, id string) (*User, error) {
    for _, u := range r.store {
        if u.ID == id {
            copy := u // value copy
            return &copy, nil
        }
    }
    return nil, nil
}

func (r *inMemoryUserRepository) Create(_ context.Context, input CreateUserInput) (User, error) {
    now := time.Now()
    user := User{
        ID:        uuid.New().String(),
        Name:      input.Name,
        Email:     input.Email,
        CreatedAt: now,
        UpdatedAt: now,
    }
    r.store = append(r.store, user)
    return user, nil
}

func (r *inMemoryUserRepository) Update(_ context.Context, id string, input UpdateUserInput) (User, error) {
    for i, u := range r.store {
        if u.ID == id {
            if input.Name != nil {
                u.Name = *input.Name
            }
            if input.Email != nil {
                u.Email = *input.Email
            }
            u.UpdatedAt = time.Now()
            r.store[i] = u
            return u, nil
        }
    }
    return User{}, fmt.Errorf("user not found: %s", id)
}

func (r *inMemoryUserRepository) Delete(_ context.Context, id string) error {
    for i, u := range r.store {
        if u.ID == id {
            r.store = append(r.store[:i], r.store[i+1:]...)
            return nil
        }
    }
    return fmt.Errorf("user not found: %s", id)
}
```
