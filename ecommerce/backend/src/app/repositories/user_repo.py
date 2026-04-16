"""User repository."""

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserRepository:
    """User repository for database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, username: str) -> User | None:
        """Get user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_multi(self, skip: int = 0, limit: int = 100) -> list[User]:
        """Get multiple users with pagination."""
        return self.db.query(User).offset(skip).limit(limit).all()

    def create(self, user_data: UserCreate, hashed_password: str) -> User:
        """Create a new user."""
        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            is_admin=user_data.is_admin,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User, user_data: UserUpdate) -> User:
        """Update an existing user."""
        for field, value in user_data.model_dump(exclude_unset=True).items():
            if field == "password":
                continue
            setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        """Delete a user."""
        self.db.delete(user)
        self.db.commit()

    def count(self) -> int:
        """Count total users."""
        return self.db.query(User).count()
