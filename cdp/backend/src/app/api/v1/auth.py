"""Authentication API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.dependencies import get_database
from app.schemas.auth import TokenResponse, UserLogin, UserRegister
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
    # Check if username already exists
    existing = auth_service.get_user_by_username(user_data.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户名已被使用",
        )

    # Check if email already exists
    if user_data.email:
        existing_email = auth_service.get_user_by_email(user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该邮箱已被注册",
            )

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
