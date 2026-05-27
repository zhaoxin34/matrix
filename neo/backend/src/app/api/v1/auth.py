"""Authentication API routes."""

from fastapi import APIRouter, Cookie, Depends, Response
from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_CONFLICT,
    ERR_FORBIDDEN,
    ERR_INVALID_PARAMETER,
    ERR_NOT_FOUND,
    ERR_OK,
)
from app.core.security import create_access_token
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    SendCodeRequest,
)
from app.services.auth_service import authenticate_user, create_user, get_user_by_phone
from app.services.sms_service import verify_code

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-code", response_model=dict)
async def send_code(request: SendCodeRequest) -> dict:
    """Send verification code to phone number (Mock implementation).

    Always returns success. The code is always '123456'.
    """
    from app.services.sms_service import send_verification_code

    await send_verification_code(request.phone, request.type)

    return {
        "code": ERR_OK,
        "message": "验证码已发送",
        "data": {"expires_in": 300},
        "traceId": "",
        "timestamp": 0,
    }


@router.post("/register", response_model=dict)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Register a new user."""
    # Check if phone already exists
    existing = get_user_by_phone(db, request.phone)
    if existing:
        return {
            "code": ERR_CONFLICT,
            "message": "该手机号已注册",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    # Mock: verify code is always '123456'
    if not verify_code(request.phone, request.code):
        return {
            "code": ERR_INVALID_PARAMETER,
            "message": "验证码错误",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    # Create user
    user = create_user(
        db,
        phone=request.phone,
        password=request.password,
        username=request.username,
    )

    # Generate token
    token = create_access_token(str(user.id))

    return {
        "code": ERR_OK,
        "message": "注册成功",
        "data": {"user_id": user.id, "username": user.username, "token": token},
        "traceId": "",
        "timestamp": 0,
    }


@router.post("/login", response_model=dict)
async def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    """Login with phone and password."""
    # Authenticate user
    user = authenticate_user(db, request.phone, request.password)
    if not user:
        return {
            "code": ERR_NOT_FOUND,
            "message": "手机号或密码错误",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    # Check if user is active
    if not user.is_active:
        return {
            "code": ERR_FORBIDDEN,
            "message": "账号已被禁用",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    # Generate token
    token = create_access_token(str(user.id))

    # Set token in httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=24 * 60 * 60,  # 24 hours
    )

    return {
        "code": ERR_OK,
        "message": "登录成功",
        "data": {"user_id": user.id, "username": user.username, "token": token},
        "traceId": "",
        "timestamp": 0,
    }


@router.post("/logout", response_model=dict)
async def logout(response: Response) -> dict:
    """Logout and clear token cookie."""
    response.delete_cookie(key="access_token")
    return {
        "code": ERR_OK,
        "message": "已退出登录",
        "data": None,
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/me", response_model=dict)
async def get_current_user(
    access_token: str | None = Cookie(None),
    db: Session = Depends(get_db),
) -> dict:
    """Get current authenticated user."""
    from app.core.security import decode_token

    if not access_token:
        return {
            "code": ERR_NOT_FOUND,
            "message": "未登录",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    # Extract token from "Bearer xxx"
    token = access_token.replace("Bearer ", "")
    payload = decode_token(token)
    if not payload:
        return {
            "code": ERR_NOT_FOUND,
            "message": "无效的 Token",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    user_id = payload.get("sub")
    if not user_id:
        return {
            "code": ERR_NOT_FOUND,
            "message": "无效的 Token",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        return {
            "code": ERR_NOT_FOUND,
            "message": "用户不存在",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    if not user.is_active:
        return {
            "code": ERR_FORBIDDEN,
            "message": "账号已被禁用",
            "data": None,
            "traceId": "",
            "timestamp": 0,
        }

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": {
            "id": user.id,
            "phone": user.phone,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
        },
        "traceId": "",
        "timestamp": 0,
    }