"""User repository."""

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """User data access repository."""

    def __init__(self, db: Session):
        self.db = db

    def find_by_username(self, username: str) -> User | None:
        """Find user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def find_by_email(self, email: str) -> User | None:
        """Find user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def find_by_id(self, user_id: int) -> User | None:
        """Find user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, user: User) -> User:
        """Create a new user."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
