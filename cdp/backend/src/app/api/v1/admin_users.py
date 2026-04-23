"""Admin user management API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.api.v1.auth import get_current_admin_user
from app.core import error_codes as err
from app.dependencies import get_database
from app.models.user import User
from app.repositories.employee_repo import EmployeeRepository
from app.repositories.user_repo import UserRepository
from app.schemas.response import ApiResponse
from app.services.auth_service import hash_password

router = APIRouter()


def get_user_repo(db=Depends(get_database)) -> UserRepository:
    return UserRepository(db)


def get_trace_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")


class UserCreateRequest(BaseModel):
    """Schema for creating a new user."""

    username: Annotated[str, Field(min_length=2, max_length=50)]
    phone: Annotated[str, Field(min_length=11, max_length=20)]
    email: str | None = None
    password: Annotated[str, Field(min_length=8)]
    is_admin: bool = False


class UserUpdateRequest(BaseModel):
    """Schema for updating a user."""

    username: Annotated[str, Field(min_length=2, max_length=50)]
    phone: Annotated[str, Field(min_length=11, max_length=20)]
    email: str | None = None
    is_admin: bool = False


class UserItemResponse(BaseModel):
    """Schema for user list item."""

    id: int
    username: str
    phone: str | None
    email: str | None
    is_admin: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for paginated user list."""

    items: list[UserItemResponse]
    total: int
    page: int
    page_size: int


@router.get("/users")
def list_users(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_admin_user),
    user_repo: UserRepository = Depends(get_user_repo),
) -> ApiResponse[UserListResponse]:
    """List all users with pagination."""
    trace_id = get_trace_id(request)

    skip = (page - 1) * page_size
    users, total = user_repo.list_users_paginated(skip=skip, limit=page_size)

    items = [
        UserItemResponse(
            id=u.id,
            username=u.username,
            phone=u.phone,
            email=u.email,
            is_admin=u.is_admin,
            created_at=u.created_at.isoformat() if u.created_at else "",
            updated_at=u.updated_at.isoformat() if u.updated_at else "",
        )
        for u in users
    ]

    return ApiResponse.success(
        data=UserListResponse(items=items, total=total, page=page, page_size=page_size),
        traceId=trace_id,
    )


@router.post("/users")
def create_user(
    request: Request,
    user_data: UserCreateRequest,
    current_user: User = Depends(get_current_admin_user),
    user_repo: UserRepository = Depends(get_user_repo),
) -> ApiResponse[UserItemResponse]:
    """Create a new user."""
    trace_id = get_trace_id(request)

    # Check duplicate username
    if user_repo.find_by_username(user_data.username):
        return ApiResponse.error(
            code=err.ERR_USER_ALREADY_EXISTS,
            message="用户名已被注册",
            traceId=trace_id,
        )

    # Check duplicate phone
    if user_repo.find_by_phone(user_data.phone):
        return ApiResponse.error(
            code=err.ERR_USER_ALREADY_EXISTS,
            message="手机号已被注册",
            traceId=trace_id,
        )

    # Create user
    user = User(
        username=user_data.username,
        phone=user_data.phone,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        is_admin=user_data.is_admin,
    )
    user_repo.create(user)

    return ApiResponse.success(
        data=UserItemResponse(
            id=user.id,
            username=user.username,
            phone=user.phone,
            email=user.email,
            is_admin=user.is_admin,
            created_at=user.created_at.isoformat() if user.created_at else "",
            updated_at=user.updated_at.isoformat() if user.updated_at else "",
        ),
        traceId=trace_id,
        message="创建成功",
    )


@router.put("/users/{user_id}")
def update_user(
    request: Request,
    user_id: int,
    user_data: UserUpdateRequest,
    current_user: User = Depends(get_current_admin_user),
    user_repo: UserRepository = Depends(get_user_repo),
) -> ApiResponse[UserItemResponse]:
    """Update an existing user."""
    trace_id = get_trace_id(request)

    user = user_repo.find_by_id(user_id)
    if not user:
        return ApiResponse.error(
            code=err.ERR_USER_NOT_FOUND,
            message="用户不存在",
            traceId=trace_id,
        )

    # Check duplicate username (excluding current user)
    existing = user_repo.find_by_username(user_data.username)
    if existing and existing.id != user_id:
        return ApiResponse.error(
            code=err.ERR_USER_ALREADY_EXISTS,
            message="用户名已被注册",
            traceId=trace_id,
        )

    # Check duplicate phone (excluding current user)
    existing = user_repo.find_by_phone(user_data.phone)
    if existing and existing.id != user_id:
        return ApiResponse.error(
            code=err.ERR_USER_ALREADY_EXISTS,
            message="手机号已被注册",
            traceId=trace_id,
        )

    # Update fields
    user.username = user_data.username
    user.phone = user_data.phone
    user.email = user_data.email
    user.is_admin = user_data.is_admin
    user_repo.update(user)

    return ApiResponse.success(
        data=UserItemResponse(
            id=user.id,
            username=user.username,
            phone=user.phone,
            email=user.email,
            is_admin=user.is_admin,
            created_at=user.created_at.isoformat() if user.created_at else "",
            updated_at=user.updated_at.isoformat() if user.updated_at else "",
        ),
        traceId=trace_id,
        message="更新成功",
    )


@router.delete("/users/{user_id}")
def delete_user(
    request: Request,
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    user_repo: UserRepository = Depends(get_user_repo),
) -> ApiResponse[dict]:
    """Delete a user after validating no employee binding exists."""
    trace_id = get_trace_id(request)

    user = user_repo.find_by_id(user_id)
    if not user:
        return ApiResponse.error(
            code=err.ERR_USER_NOT_FOUND,
            message="用户不存在",
            traceId=trace_id,
        )

    # Before delete check - validate no employee binding
    employee_repo = EmployeeRepository(user_repo.db)
    mapping = employee_repo.find_mapping_by_user_id(user_id)
    if mapping:
        # Get organization name
        employee = employee_repo.find_by_id(mapping.employee_id)
        org_name = "未知"
        if employee and employee.primary_unit:
            org_name = employee.primary_unit.name

        return ApiResponse.error(
            code=err.ERR_INVALID_PARAMETER,
            message=f"用户已经是「{org_name}」组织的成员，暂时不能删除，如想删除，需要先去组织里解绑用户",
            traceId=trace_id,
        )

    user_repo.delete(user)

    return ApiResponse.success(
        data={},
        traceId=trace_id,
        message="删除成功",
    )
