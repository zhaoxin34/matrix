"""Authentication service."""

import bcrypt
from sqlalchemy.orm import Session

from app.models.user import User


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_user(
    db: Session,
    phone: str,
    password: str,
    username: str | None = None,
) -> User:
    """Create a new user."""
    hashed = hash_password(password)
    user = User(
        phone=phone,
        hashed_password=hashed,
        username=username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_phone(db: Session, phone: str) -> User | None:
    """Get user by phone number."""
    return db.query(User).filter(User.phone == phone).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, phone: str, password: str) -> User | None:
    """Authenticate user by phone and password."""
    user = get_user_by_phone(db, phone)
    if not user:
        return None
    if not verify_password(password, str(user.hashed_password)):
        return None
    return user
