"""Authentication service."""

from datetime import datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin, UserRegister

logger = get_logger(__name__)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def hash_password(password: str) -> str:
    """Hash a password."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    """Create JWT access token."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    """Create JWT refresh token."""
    expires_delta = timedelta(days=7)
    expire = datetime.utcnow() + expires_delta
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


class AuthService:
    """Authentication service."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> User | None:
        """Get user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_email(self, email: str) -> User | None:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_user_by_phone(self, phone: str) -> User | None:
        """Get user by phone number."""
        return self.db.query(User).filter(User.phone == phone).first()

    def create_user(self, user_data: UserRegister) -> User:
        """Create a new user with hashed password."""
        hashed_pw = hash_password(user_data.password)
        user = User(
            username=user_data.username,
            email=user_data.email,
            phone=user_data.phone,
            hashed_password=hashed_pw,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        logger.info(
            "user.registered", extra={"event": "user.registered", "user_id": user.id, "username": user.username}
        )

        return user

    def authenticate(self, login_data: UserLogin) -> TokenResponse:
        """Authenticate user and return tokens."""
        user = self.get_user_by_phone(login_data.phone)
        if not user:
            logger.warning(
                "user.login.failed",
                extra={"event": "user.login.failed", "phone": login_data.phone, "reason": "user_not_found"},
            )
            raise ValueError("用户名或密码错误")

        if not verify_password(login_data.password, user.hashed_password):
            logger.warning(
                "user.login.failed",
                extra={"event": "user.login.failed", "user_id": user.id, "reason": "wrong_password"},
            )
            raise ValueError("用户名或密码错误")

        logger.info("user.login", extra={"event": "user.login", "user_id": user.id, "username": user.username})

        return self._create_tokens_for_user(user)

    def _create_tokens_for_user(self, user: User) -> TokenResponse:
        """Create access and refresh tokens for user."""
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    def get_current_user(self, token: str) -> User | None:
        """Get current user from JWT token."""
        payload = decode_token(token)
        if not payload:
            return None

        if payload.get("type") != "access":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        return self.get_user_by_id(int(user_id))
