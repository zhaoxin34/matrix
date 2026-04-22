"""Authentication API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import error_codes as err
from app.dependencies import get_database
from app.schemas.auth import (
    SmsSendRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.schemas.response import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter()


def get_auth_service(db: Session = Depends(get_database)) -> AuthService:
    """Get auth service."""
    return AuthService(db)


def get_trace_id(request: Request) -> str:
    """Get trace ID from request state."""
    return getattr(request.state, "request_id", "")


@router.post("/register")
def register(
    request: Request,
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[TokenResponse]:
    """Register a new user."""
    trace_id = get_trace_id(request)
    try:
        user = auth_service.create_user(user_data)
        token_data = auth_service._create_tokens_for_user(user)
        return ApiResponse.success(
            data=token_data,
            traceId=trace_id,
            message="注册成功",
        )
    except IntegrityError as e:
        error_msg = str(e.args[0]) if e.args else str(e)
        if "email" in error_msg.lower() or "duplicate" in error_msg.lower():
            return ApiResponse.error(
                code=err.ERR_USER_ALREADY_EXISTS,
                message="该邮箱已被注册",
                traceId=trace_id,
            )
        if "username" in error_msg.lower():
            return ApiResponse.error(
                code=err.ERR_USER_ALREADY_EXISTS,
                message="该用户名已被使用",
                traceId=trace_id,
            )
        return ApiResponse.error(
            code=err.ERR_INVALID_PARAMETER,
            message="注册失败，请检查输入信息",
            traceId=trace_id,
        )


@router.post("/login")
def login(
    request: Request,
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[TokenResponse]:
    """Login with username and password."""
    trace_id = get_trace_id(request)
    try:
        token_response = auth_service.authenticate(login_data)
        return ApiResponse.success(
            data=token_response,
            traceId=trace_id,
            message="登录成功",
        )
    except ValueError as e:
        return ApiResponse.error(
            code=err.ERR_UNAUTHORIZED,
            message=str(e),
            traceId=trace_id,
        )


@router.post("/sms/send")
def send_sms(
    request: Request,
    sms_request: SmsSendRequest,
) -> ApiResponse[dict]:
    """Send SMS verification code (fake implementation)."""
    trace_id = get_trace_id(request)
    # TODO: Implement actual SMS sending
    return ApiResponse.success(
        data={"code": "123456"},
        traceId=trace_id,
        message="验证码已发送",
    )


@router.get("/me")
def get_current_user(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[UserResponse]:
    """Get current authenticated user."""
    trace_id = get_trace_id(request)

    if not authorization or not authorization.startswith("Bearer "):
        return ApiResponse.error(
            code=err.ERR_UNAUTHORIZED,
            message="Not authenticated",
            traceId=trace_id,
        )

    token = authorization.replace("Bearer ", "")
    user = auth_service.get_current_user(token)
    if not user:
        return ApiResponse.error(
            code=err.ERR_UNAUTHORIZED,
            message="Invalid or expired token",
            traceId=trace_id,
        )

    return ApiResponse.success(
        data=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            phone=user.phone,
        ),
        traceId=trace_id,
        message="ok",
    )


@router.post("/logout")
def logout(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
    auth_service: AuthService = Depends(get_auth_service),
) -> ApiResponse[dict]:
    """Logout current user (client should delete tokens after this)."""
    trace_id = get_trace_id(request)

    if not authorization or not authorization.startswith("Bearer "):
        return ApiResponse.error(
            code=err.ERR_UNAUTHORIZED,
            message="Not authenticated",
            traceId=trace_id,
        )

    token = authorization.replace("Bearer ", "")
    auth_service.logout(token)

    return ApiResponse.success(
        data={},
        traceId=trace_id,
        message="登出成功",
    )
