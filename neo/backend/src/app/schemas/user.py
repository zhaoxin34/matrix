"""User management schemas."""

from datetime import datetime
from typing import List

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    """Response schema for user."""

    id: int = Field(..., description="User ID")
    phone: str = Field(..., description="Phone number")
    username: str | None = Field(None, description="Display name")
    email: str | None = Field(None, description="Email")
    is_admin: bool = Field(..., description="Is admin")
    is_active: bool = Field(..., description="Is active")
    created_at: datetime = Field(..., description="Creation time")

    model_config = {"from_attributes": True}


class LinkedEmployeeInfo(BaseModel):
    """Linked employee info for user."""

    id: int = Field(..., description="Employee ID")
    name: str = Field(..., description="Employee name")
    employee_no: str = Field(..., description="Employee number")

    model_config = {"from_attributes": True}


class UserListItem(BaseModel):
    """User list item schema."""

    id: int
    phone: str
    username: str | None
    email: str | None
    is_admin: bool
    is_active: bool
    created_at: datetime
    linked_employee: LinkedEmployeeInfo | None = None

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    """Response schema for user list."""

    total: int = Field(..., description="Total count")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Page size")
    list: List[UserListItem] = Field(..., description="User list")


class CreateUserRequest(BaseModel):
    """Request schema for creating user."""

    phone: str = Field(
        ...,
        description="Phone number",
        min_length=11,
        max_length=11,
    )
    username: str | None = Field(
        None,
        description="Display name",
        max_length=50,
    )
    email: str | None = Field(
        None,
        description="Email",
        max_length=100,
    )


class UpdateUserRequest(BaseModel):
    """Request schema for updating user."""

    username: str | None = Field(
        None,
        description="Display name",
        max_length=50,
    )
    email: str | None = Field(
        None,
        description="Email",
        max_length=100,
    )


class UpdateUserStatusRequest(BaseModel):
    """Request schema for updating user status."""

    is_active: bool = Field(..., description="Target active status")
