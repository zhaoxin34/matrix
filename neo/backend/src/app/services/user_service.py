"""User service."""

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import (
    create_user as create_user_repo,
)
from app.repositories.user_repository import (
    get_user_by_id,
    get_user_by_phone,
)
from app.repositories.user_repository import (
    get_users as get_users_repo,
)
from app.repositories.user_repository import (
    update_user as update_user_repo,
)
from app.repositories.user_repository import (
    update_user_status as update_user_status_repo,
)
from app.services.auth_service import hash_password


def get_user(db: Session, user_id: int) -> User | None:
    """Get user by ID."""
    return get_user_by_id(db, user_id)


def get_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> tuple[list[User], int]:
    """Get paginated user list."""
    return get_users_repo(db, page, page_size, search)


def create_user(
    db: Session,
    phone: str,
    password: str,
    username: str | None = None,
    email: str | None = None,
) -> User:
    """Create a new user with hashed password."""
    hashed = hash_password(password)
    return create_user_repo(db, phone, hashed, username, email)


def update_user(
    db: Session,
    user_id: int,
    username: str | None = None,
    email: str | None = None,
) -> User | None:
    """Update user profile."""
    return update_user_repo(db, user_id, username, email)


def update_user_status(db: Session, user_id: int, is_active: bool) -> User | None:
    """Update user active status."""
    return update_user_status_repo(db, user_id, is_active)


def is_phone_exists(db: Session, phone: str) -> bool:
    """Check if phone number already exists."""
    return get_user_by_phone(db, phone) is not None
