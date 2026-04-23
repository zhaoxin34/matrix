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

    def find_by_phone(self, phone: str) -> User | None:
        """Find user by phone."""
        return self.db.query(User).filter(User.phone == phone).first()

    def find_by_id(self, user_id: int) -> User | None:
        """Find user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def list_users(self, keyword: str | None = None, skip: int = 0, limit: int = 50) -> list[User]:
        """List users with optional keyword filter."""
        query = self.db.query(User).filter(User.is_active.is_(True))
        if keyword:
            query = query.filter(
                (User.username.ilike(f"%{keyword}%"))
                | (User.email.ilike(f"%{keyword}%"))
                | (User.phone.ilike(f"%{keyword}%"))
            )
        return query.offset(skip).limit(limit).all()

    def list_users_paginated(self, skip: int = 0, limit: int = 10) -> tuple[list[User], int]:
        """List users with pagination, returns (items, total)."""
        query = self.db.query(User).filter(User.is_active.is_(True))
        total = query.count()
        items = query.order_by(User.id.desc()).offset(skip).limit(limit).all()
        return items, total

    def create(self, user: User) -> User:
        """Create a new user."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        """Update an existing user."""
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        """Delete a user."""
        self.db.delete(user)
        self.db.commit()
