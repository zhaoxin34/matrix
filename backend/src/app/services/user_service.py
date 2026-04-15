"""User service."""

from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, NotFoundException
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.repositories.user_repo import UserRepository
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserUpdate


class UserService:
    """User service for business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repo = UserRepository(db)

    def get_by_id(self, user_id: int) -> UserRepository:
        """Get user by ID."""
        user = self.repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    def get_by_username(self, username: str) -> UserRepository:
        """Get user by username."""
        user = self.repo.get_by_username(username)
        if not user:
            raise NotFoundException("User not found")
        return user

    def get_multi(self, skip: int = 0, limit: int = 100) -> list:
        """Get multiple users."""
        return self.repo.get_multi(skip=skip, limit=limit)

    def create(self, user_data: UserCreate) -> UserRepository:
        """Create a new user."""
        existing_user = self.repo.get_by_username(user_data.username)
        if existing_user:
            raise ConflictException("Username already registered")
        existing_email = self.repo.get_by_email(user_data.email)
        if existing_email:
            raise ConflictException("Email already registered")

        hashed_password = get_password_hash(user_data.password)
        return self.repo.create(user_data, hashed_password)

    def update(self, user_id: int, user_data: UserUpdate) -> UserRepository:
        """Update an existing user."""
        user = self.get_by_id(user_id)
        return self.repo.update(user, user_data)

    def delete(self, user_id: int) -> None:
        """Delete a user."""
        user = self.get_by_id(user_id)
        self.repo.delete(user)

    def authenticate(self, login_data: UserLogin) -> TokenResponse:
        """Authenticate user and return access token."""
        user = self.repo.get_by_username(login_data.username)
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise NotFoundException("Invalid username or password")

        access_token = create_access_token(
            data={"sub": user.username, "user_id": user.id},
            expires_delta=timedelta(minutes=30),
        )
        return TokenResponse(access_token=access_token)

    def count(self) -> int:
        """Count total users."""
        return self.repo.count()
