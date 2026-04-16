"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.dependencies import get_database, get_current_user
from app.models.user import User
from app.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    SMSCodeRequest,
    SMSCodeVerify,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter()


def get_auth_service(db: Session = Depends(get_database)) -> AuthService:
    """Get auth service."""
    return AuthService(db)


@router.post("/register", response_model=TokenResponse)
@limiter.limit("3/hour")
def register(
    request: Request,
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Register a new user."""
    # Check if phone already exists
    existing = auth_service.get_user_by_phone(user_data.phone)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该手机号已注册",
        )

    user = auth_service.create_user(user_data)
    return auth_service._create_tokens_for_user(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15 minutes")
def login(
    request: Request,
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Login with phone and password."""
    try:
        return auth_service.authenticate(login_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    refresh_data: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Refresh access token using refresh token."""
    try:
        return auth_service.refresh_access_token(refresh_data.refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/logout")
def logout(
    refresh_data: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Logout and invalidate refresh token."""
    auth_service.logout(refresh_data.refresh_token)
    return {"message": "已退出登录"}


@router.post("/password-reset/request")
@limiter.limit("3/day")
def password_reset_request(
    request: Request,
    data: PasswordResetRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Request password reset via SMS."""
    auth_service.request_password_reset(data)
    return {"message": "验证码已发送"}


@router.post("/password-reset/confirm")
def password_reset_confirm(
    data: PasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Confirm password reset with SMS code."""
    try:
        auth_service.reset_password(data)
        return {"message": "密码重置成功"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/sms/send")
@limiter.limit("5/hour")
def send_sms(
    request: Request,
    data: SMSCodeRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Send SMS verification code."""
    try:
        auth_service.send_sms_code(data)
        return {"message": "验证码已发送"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/sms/verify")
def verify_sms(
    data: SMSCodeVerify,
    auth_service: AuthService = Depends(get_auth_service),
) -> dict:
    """Verify SMS code."""
    if auth_service.verify_sms_code(data):
        return {"message": "验证成功"}
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="验证码错误或已过期",
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Get current authenticated user."""
    return current_user
