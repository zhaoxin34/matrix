"""Workspace schemas."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class WorkspaceStatusEnum(str, Enum):
    """Workspace status enum."""

    ACTIVE = "active"
    DISABLED = "disabled"


class MemberRoleEnum(str, Enum):
    """Workspace member role enum."""

    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"


# ==================== Workspace Schemas ====================


class WorkspaceBase(BaseModel):
    """Base schema for workspace."""

    name: str = Field(..., description="Workspace name", min_length=1, max_length=50)
    description: str | None = Field(
        None,
        description="Description",
        max_length=500,
    )


class WorkspaceCreate(WorkspaceBase):
    """Schema for creating workspace."""

    org_id: int = Field(..., description="Organization ID", gt=0)


class WorkspaceUpdate(BaseModel):
    """Schema for updating workspace."""

    name: str | None = Field(None, description="Workspace name", min_length=1, max_length=50)
    description: str | None = Field(None, description="Description", max_length=500)


class WorkspaceResponse(BaseModel):
    """Schema for workspace response."""

    id: int
    name: str
    code: str
    description: str | None = None
    status: WorkspaceStatusEnum
    org_id: int
    owner_id: int
    settings: str | None = None
    created_at: datetime
    updated_at: datetime
    disabled_at: datetime | None = None
    disabled_by: int | None = None
    # Computed fields
    member_count: int | None = None
    project_count: int | None = None

    model_config = {"from_attributes": True}


class WorkspaceListItem(BaseModel):
    """Schema for workspace list item."""

    id: int
    name: str
    code: str
    description: str | None = None
    status: WorkspaceStatusEnum
    org_id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    # Computed fields
    member_count: int | None = None
    project_count: int | None = None

    model_config = {"from_attributes": True}


class WorkspaceListResponse(BaseModel):
    """Schema for workspace list response."""

    total: int
    page: int
    page_size: int
    list: List[WorkspaceListItem]


class WorkspaceStatusUpdate(BaseModel):
    """Schema for updating workspace status."""

    # No fields needed, uses endpoint path to determine action


class TransferOwnerRequest(BaseModel):
    """Schema for transferring workspace ownership."""

    new_owner_id: int = Field(..., description="New owner user ID", gt=0)


# ==================== Workspace Member Schemas ====================


class MemberBase(BaseModel):
    """Base schema for workspace member."""

    user_id: int = Field(..., description="User ID", gt=0)
    role: MemberRoleEnum = Field(..., description="Member role")


class MemberAdd(MemberBase):
    """Schema for adding workspace member."""


class MemberUpdate(BaseModel):
    """Schema for updating workspace member role."""

    role: MemberRoleEnum = Field(..., description="New role")


class MemberResponse(BaseModel):
    """Schema for workspace member response."""

    id: int
    workspace_id: int
    user_id: int
    role: MemberRoleEnum
    created_at: datetime
    updated_at: datetime
    # Joined user info
    username: str | None = None
    phone: str | None = None

    model_config = {"from_attributes": True}


class MemberListItem(BaseModel):
    """Schema for member list item."""

    id: int
    user_id: int
    username: str | None = None
    phone: str | None = None
    role: MemberRoleEnum
    joined_at: datetime

    model_config = {"from_attributes": True}


class MemberListResponse(BaseModel):
    """Schema for member list response."""

    total: int
    page: int
    page_size: int
    list: List[MemberListItem]


# ==================== Pagination Schema ====================


class PaginatedWorkspaceResponse(BaseModel):
    """Schema for paginated workspace list response."""

    total: int
    page: int
    page_size: int
