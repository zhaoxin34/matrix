"""Project schemas."""

import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProjectStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    archived = "archived"


class ProjectMemberRole(str, enum.Enum):
    admin = "admin"
    member = "member"


# Project Schemas
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="项目名称")
    code: str = Field(..., min_length=1, max_length=100, description="项目代码（唯一）")
    description: Optional[str] = Field(None, description="项目描述")


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    description: Optional[str]
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int


# Project Member Schemas
class ProjectMemberCreate(BaseModel):
    user_id: int = Field(..., description="用户ID")
    role: ProjectMemberRole = Field(default=ProjectMemberRole.member, description="角色")


class ProjectMemberUpdate(BaseModel):
    role: ProjectMemberRole = Field(..., description="角色")


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    user_id: int
    role: ProjectMemberRole
    created_at: datetime
    user: Optional["UserResponse"] = None


class ProjectMemberListResponse(BaseModel):
    items: list[ProjectMemberResponse]
    total: int


# Org Project Schemas
class OrgProjectCreate(BaseModel):
    org_id: int = Field(..., description="组织ID")


class OrgProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    org_id: int
    project_id: int
    created_at: datetime
    organization: Optional["OrgUnitResponse"] = None


class OrgProjectListResponse(BaseModel):
    items: list[OrgProjectResponse]
    total: int


# User Project (for user's project list)
class UserProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    status: ProjectStatus
    role: ProjectMemberRole
    created_at: datetime


class UserProjectListResponse(BaseModel):
    items: list[UserProjectResponse]
    total: int


# Import for type hints
from app.schemas.auth import UserResponse  # noqa: E402, F401
from app.schemas.org_unit import OrgUnitResponse  # noqa: E402, F401
