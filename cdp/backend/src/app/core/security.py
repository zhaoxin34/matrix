"""Security utilities."""

from datetime import datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from app.config import settings


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
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None
