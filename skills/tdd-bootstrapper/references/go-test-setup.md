# Go Testing TDD Setup

## Test Configuration

```bash
# Run tests with coverage
go test -coverprofile=coverage.out -covermode=atomic ./...

# View coverage report
go tool cover -html=coverage.out -o coverage.html

# Check coverage threshold (script)
COVERAGE=$(go test -coverprofile=coverage.out ./... 2>&1 | grep "coverage:" | awk '{print $2}' | tr -d '%')
if [ "$(echo "$COVERAGE < 80" | bc)" -eq 1 ]; then
    echo "Coverage $COVERAGE% is below 80% threshold"
    exit 1
fi
```

## Test Template

```go
package user_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestRegisterUser(t *testing.T) {
    t.Run("creates user with valid input", func(t *testing.T) {
        // Arrange
        repo := NewMockUserRepository()
        sut := NewRegistrationService(repo)
        input := CreateUserInput{
            Name:  "Alice",
            Email: "alice@example.com",
            Password: "SecurePass123!",
        }

        // Act
        result, err := sut.Register(context.Background(), input)

        // Assert
        require.NoError(t, err)
        assert.NotEmpty(t, result.ID)
        assert.Equal(t, "Alice", result.Name)
    })

    t.Run("rejects duplicate email", func(t *testing.T) {
        // Arrange
        repo := NewMockUserRepository()
        repo.AddExisting(User{ID: "existing", Email: "taken@example.com"})
        sut := NewRegistrationService(repo)
        input := CreateUserInput{
            Name:  "Bob",
            Email: "taken@example.com",
            Password: "SecurePass123!",
        }

        // Act
        _, err := sut.Register(context.Background(), input)

        // Assert
        assert.ErrorIs(t, err, ErrDuplicateEmail)
    })

    t.Run("rejects weak password", func(t *testing.T) {
        // Arrange
        repo := NewMockUserRepository()
        sut := NewRegistrationService(repo)
        input := CreateUserInput{
            Name:  "Charlie",
            Email: "c@example.com",
            Password: "123",
        }

        // Act
        _, err := sut.Register(context.Background(), input)

        // Assert
        assert.ErrorIs(t, err, ErrWeakPassword)
    })
}
```

## Table-Driven Tests

```go
func TestValidatePassword(t *testing.T) {
    tests := []struct {
        name     string
        password string
        wantErr  error
    }{
        {"valid password", "SecurePass123!", nil},
        {"too short", "Ab1!", ErrWeakPassword},
        {"no uppercase", "securepass123!", ErrWeakPassword},
        {"no lowercase", "SECUREPASS123!", ErrWeakPassword},
        {"no number", "SecurePassword!", ErrWeakPassword},
        {"empty string", "", ErrWeakPassword},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidatePassword(tt.password)
            if tt.wantErr != nil {
                assert.ErrorIs(t, err, tt.wantErr)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

## Mock Repository

```go
type MockUserRepository struct {
    store []User
}

func NewMockUserRepository() *MockUserRepository {
    return &MockUserRepository{store: []User{}}
}

func (m *MockUserRepository) AddExisting(u User) {
    m.store = append(m.store, u)
}

func (m *MockUserRepository) FindByEmail(_ context.Context, email string) (*User, error) {
    for _, u := range m.store {
        if u.Email == email {
            copy := u
            return &copy, nil
        }
    }
    return nil, nil
}

func (m *MockUserRepository) Create(_ context.Context, input CreateUserInput) (User, error) {
    user := User{
        ID:    uuid.New().String(),
        Name:  input.Name,
        Email: input.Email,
    }
    m.store = append(m.store, user)
    return user, nil
}
```
