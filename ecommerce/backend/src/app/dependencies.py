"""Application dependencies."""

from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


def get_database() -> Generator[Session, None, None]:
    """Get database session dependency."""
    yield from get_db()


def get_auth_service(db: Session = Depends(get_database)) -> AuthService:
    """Get auth service dependency."""
    return AuthService(db)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    user = auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已过期，请重新登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_optional),
    auth_service: AuthService = Depends(get_auth_service),
) -> User | None:
    """Get current authenticated user from JWT token, or None if not provided."""
    if credentials is None:
        return None
    token = credentials.credentials
    user = auth_service.get_current_user(token)
    return user
