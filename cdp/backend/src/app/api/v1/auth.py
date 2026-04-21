"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Annotated

from app.dependencies import get_database
from app.schemas.auth import (
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    SmsSendRequest,
)
from app.services.auth_service import AuthService

router = APIRouter()


def get_auth_service(db: Session = Depends(get_database)) -> AuthService:
    """Get auth service."""
    return AuthService(db)


@router.post("/register", response_model=TokenResponse)
def register(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Register a new user."""
    try:
        user = auth_service.create_user(user_data)
    except IntegrityError as e:
        error_msg = str(e.args[0]) if e.args else str(e)
        if "email" in error_msg.lower() or "duplicate" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被注册",
            )
        if "username" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该用户名已被使用",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="注册失败，请检查输入信息",
        )
    return auth_service._create_tokens_for_user(user)


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Login with username and password."""
    try:
        token_response = auth_service.authenticate(login_data)
        return token_response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/sms/send")
def send_sms(request: SmsSendRequest):
    """Send SMS verification code (fake implementation)."""
    # TODO: Implement actual SMS sending
    return {"message": "验证码已发送", "code": "123456"}


@router.get("/me", response_model=UserResponse)
def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Get current authenticated user."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    token = authorization.replace("Bearer ", "")
    user = auth_service.get_current_user(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        phone=user.phone,
    )
