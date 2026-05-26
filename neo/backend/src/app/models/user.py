"""User model definition."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    """User model for authentication and management.

    Attributes:
        id: Primary key
        phone: Phone number (unique, used for login)
        hashed_password: Bcrypt hashed password
        username: Display name (optional, unique)
        email: Email address (optional, unique)
        is_admin: Whether user is admin
        is_active: Whether user account is active
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    username = Column(String(50), unique=True, nullable=True)
    email = Column(String(100), unique=True, nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, phone={self.phone}, username={self.username})>"
