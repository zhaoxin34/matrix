"""Admin user management API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_CONFLICT,
    ERR_FORBIDDEN,
    ERR_NOT_FOUND,
    ERR_OK,
)
from app.database import get_db
from app.schemas.user import (
    CreateUserRequest,
    LinkedEmployeeInfo,
    UpdateUserRequest,
    UpdateUserStatusRequest,
    UserListItem,
)
from app.services.user_service import (
    create_user as create_user_service,
)
from app.services.user_service import (
    get_unlinked_users,
    get_user,
    get_user_with_link_status,
    get_users,
    is_phone_exists,
    update_user,
    update_user_status,
)

router = APIRouter(prefix="/admin/users", tags=["admin", "user-management"])


def _make_error_response(code: int, message: str) -> dict:
    """Helper to create error response."""
    return {
        "code": code,
        "message": message,
        "data": None,
        "traceId": "",
        "timestamp": 0,
    }


@router.get("", response_model=dict)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    """Get paginated user list."""
    if page < 1:
        page = 1
    if page_size < 1 or page_size > 100:
        page_size = 20

    users, total = get_users(db, page, page_size, search)

    # Build response with link status for each user
    from app.services import user_service as us

    user_list = []
    for user in users:
        user_info = us.get_user_with_link_status(db, int(user.id))
        if user_info:
            linked_employee = None
            if user_info.get("linked_employee"):
                linked_employee = LinkedEmployeeInfo(**user_info["linked_employee"])
            user_list.append(
                UserListItem(
                    id=int(user.id),
                    phone=str(user.phone),
                    username=user.username,
                    email=user.email,
                    is_admin=bool(user.is_admin),
                    is_active=bool(user.is_active),
                    created_at=user.created_at,  # type: ignore[arg-type]
                    linked_employee=linked_employee,
                )
            )

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "list": [item.model_dump() for item in user_list],
        },
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/unlinked", response_model=dict)
async def list_unlinked_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    """Get paginated list of users that are not linked to any employee.

    Used for employee creation - admin can select from this list.
    """
    users, total = get_unlinked_users(db, page, page_size, search)

    # Mask phone numbers for privacy (show only first 3 and last 4 digits)
    user_list = []
    for user in users:
        phone_str = str(user.phone)
        masked_phone = f"{phone_str[:3]}****{phone_str[-4:]}" if len(phone_str) >= 7 else phone_str
        user_list.append(
            {
                "id": int(user.id),  # type: ignore[arg-type]
                "phone": masked_phone,
                "username": user.username,
                "email": user.email,
                "is_active": bool(user.is_active),  # type: ignore[arg-type]
                "linked_employee": None,  # Always None for unlinked users
            }
        )

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "list": user_list,
        },
        "traceId": "",
        "timestamp": 0,
    }


@router.post("", response_model=dict)
async def create_user_handler(
    request: CreateUserRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Create a new user."""
    # Check if phone already exists
    if is_phone_exists(db, request.phone):
        return _make_error_response(ERR_CONFLICT, "该手机号已注册")

    # Generate a random password for the new user
    # In real scenario, this would be sent via SMS or email
    import secrets

    temp_password = secrets.token_urlsafe(8)[:12]

    user = create_user_service(
        db,
        phone=request.phone,
        password=temp_password,
        username=request.username,
        email=request.email,
    )

    return {
        "code": ERR_OK,
        "message": "用户创建成功",
        "data": {
            "id": user.id,
            "phone": user.phone,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
        },
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/{user_id}", response_model=dict)
async def get_user_handler(
    user_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get user by ID with link status to employee."""
    user_info = get_user_with_link_status(db, user_id)
    if not user_info:
        return _make_error_response(ERR_NOT_FOUND, "用户不存在")

    linked_employee = None
    if user_info.get("linked_employee"):
        linked_employee = LinkedEmployeeInfo(**user_info["linked_employee"])

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": {
            "id": user_info["id"],
            "phone": user_info["phone"],
            "username": user_info["username"],
            "email": user_info["email"],
            "is_admin": user_info["is_admin"],
            "is_active": user_info["is_active"],
            "created_at": user_info["created_at"].isoformat(),
            "linked_employee": linked_employee.model_dump() if linked_employee else None,
        },
        "traceId": "",
        "timestamp": 0,
    }


@router.put("/{user_id}", response_model=dict)
async def update_user_handler(
    user_id: int,
    request: UpdateUserRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Update user profile.

    Only username and email can be updated.
    Phone cannot be changed after registration.
    """
    # Check if user exists
    existing = get_user(db, user_id)
    if not existing:
        return _make_error_response(ERR_NOT_FOUND, "用户不存在")

    # Cannot update super admin
    if bool(existing.is_admin):
        return _make_error_response(ERR_FORBIDDEN, "无法修改管理员账号")

    # Update user
    updated = update_user(
        db,
        user_id,
        username=request.username,
        email=request.email,
    )

    if not updated:
        return _make_error_response(ERR_NOT_FOUND, "用户不存在")

    return {
        "code": ERR_OK,
        "message": "用户信息已更新",
        "data": {
            "id": updated.id,
            "phone": updated.phone,
            "username": updated.username,
            "email": updated.email,
            "is_admin": updated.is_admin,
            "is_active": updated.is_active,
            "created_at": updated.created_at.isoformat(),
        },
        "traceId": "",
        "timestamp": 0,
    }


@router.patch("/{user_id}/status", response_model=dict)
async def update_user_status_handler(
    user_id: int,
    request: UpdateUserStatusRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Enable or disable user."""
    # Check if user exists
    existing = get_user(db, user_id)
    if not existing:
        return _make_error_response(ERR_NOT_FOUND, "用户不存在")

    # Cannot disable super admin
    if bool(existing.is_admin):
        return _make_error_response(ERR_FORBIDDEN, "无法禁用管理员账号")

    # Update status
    updated = update_user_status(db, user_id, request.is_active)

    if not updated:
        return _make_error_response(ERR_NOT_FOUND, "用户不存在")

    return {
        "code": ERR_OK,
        "message": f"用户已{'启用' if request.is_active else '禁用'}",
        "data": {
            "id": updated.id,
            "is_active": updated.is_active,
        },
        "traceId": "",
        "timestamp": 0,
    }
