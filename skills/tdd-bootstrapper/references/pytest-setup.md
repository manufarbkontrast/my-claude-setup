# Pytest TDD Setup

## Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests", "src"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
addopts = "--cov=src --cov-report=term-missing --cov-fail-under=80"

[tool.coverage.run]
source = ["src"]
omit = ["*/tests/*", "*/__init__.py"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

## Test Template

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.features.user_registration import register_user

class TestRegisterUser:
    """Tests for user registration feature."""

    @pytest.fixture
    def mock_repo(self):
        repo = AsyncMock()
        repo.find_by_email.return_value = None
        repo.create.return_value = User(
            id="generated-id",
            name="Alice",
            email="alice@example.com",
            created_at=datetime.now(timezone.utc),
        )
        return repo

    @pytest.fixture
    def sut(self, mock_repo):
        return UserRegistrationService(repo=mock_repo)

    async def test_creates_user_with_valid_input(self, sut, mock_repo):
        # Arrange
        input_data = CreateUserInput(
            name="Alice",
            email="alice@example.com",
            password="SecurePass123!",
        )

        # Act
        result = await sut.register(input_data)

        # Assert
        assert result.id == "generated-id"
        assert result.name == "Alice"
        mock_repo.create.assert_called_once()

    async def test_rejects_duplicate_email(self, sut, mock_repo):
        # Arrange
        mock_repo.find_by_email.return_value = User(id="existing")
        input_data = CreateUserInput(
            name="Bob",
            email="existing@example.com",
            password="SecurePass123!",
        )

        # Act & Assert
        with pytest.raises(DuplicateEmailError):
            await sut.register(input_data)

    async def test_rejects_weak_password(self, sut):
        # Arrange
        input_data = CreateUserInput(
            name="Charlie",
            email="c@example.com",
            password="123",
        )

        # Act & Assert
        with pytest.raises(WeakPasswordError):
            await sut.register(input_data)
```

## Fixture Factory Pattern (Immutable)

```python
from dataclasses import replace

@pytest.fixture
def base_user():
    return User(
        id="default-id",
        name="Default Name",
        email="default@example.com",
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )

def make_user(**overrides) -> User:
    """Factory for creating test users with frozen dataclass."""
    base = User(
        id="default-id",
        name="Default Name",
        email="default@example.com",
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )
    return replace(base, **overrides) if overrides else base

# Usage
user = make_user(name="Custom Name")
admin = make_user(name="Admin", role="admin")
```
