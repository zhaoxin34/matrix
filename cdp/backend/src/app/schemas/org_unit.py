"""组织单元 Schemas"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.org_unit import OrgUnitStatus, OrgUnitType


class OrgUnitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    type: OrgUnitType
    parent_id: Optional[int] = None
    leader_id: Optional[int] = None
    sort_order: int = Field(default=0)


class OrgUnitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    leader_id: Optional[int] = None
    sort_order: Optional[int] = None
    status: Optional[OrgUnitStatus] = None


class OrgUnitMove(BaseModel):
    new_parent_id: Optional[int] = None


class OrgUnitResponse(BaseModel):
    id: int
    name: str
    code: str
    type: OrgUnitType
    parent_id: Optional[int] = None
    level: int
    status: OrgUnitStatus
    sort_order: int
    leader_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrgUnitTreeNode(BaseModel):
    id: int
    name: str
    code: str
    type: OrgUnitType
    parent_id: Optional[int] = None
    level: int
    status: OrgUnitStatus
    sort_order: int
    leader_id: Optional[int] = None
    member_count: int = 0
    total_member_count: int = 0
    children: list["OrgUnitTreeNode"] = []

    model_config = {"from_attributes": True}


class OrgUnitListResponse(BaseModel):
    items: list[OrgUnitResponse]
    total: int
