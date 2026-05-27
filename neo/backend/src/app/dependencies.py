"""Dependencies injection."""

from typing import Optional

from fastapi import Cookie, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import SessionLocal, get_db
from app.models.user import User


def get_session():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _extract_token(
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
) -> str:
    """Extract token from cookie or authorization header.

    Priority: Authorization header > Cookie
    """
    # First try Authorization header
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]

    # Fallback to cookie
    if access_token:
        return access_token.replace("Bearer ", "")

    return ""


def get_current_user(
    request: Request,
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from token.

    Supports both cookie and Authorization header authentication.
    """
    # Extract token from either cookie or header
    token = _extract_token(access_token, authorization)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")

    return user
