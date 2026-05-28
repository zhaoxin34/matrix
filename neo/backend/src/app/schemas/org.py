"""Organization unit schemas."""

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class OrgUnitTypeEnum(str, Enum):
    """Organization unit type enum."""

    COMPANY = "company"
    BRANCH = "branch"
    DEPARTMENT = "department"
    SUB_DEPARTMENT = "sub_department"


class OrgUnitStatusEnum(str, Enum):
    """Organization unit status enum."""

    ACTIVE = "active"
    INACTIVE = "inactive"


class EmployeeStatusEnum(str, Enum):
    """Employee status enum."""

    ONBOARDING = "onboarding"
    ON_JOB = "on_job"
    TRANSFERRING = "transferring"
    OFFBOARDING = "offboarding"


class TransferTypeEnum(str, Enum):
    """Transfer type enum."""

    PROMOTION = "promotion"
    DEMOTION = "demotion"
    TRANSFER = "transfer"


# ==================== Organization Unit Schemas ====================


class OrgUnitBase(BaseModel):
    """Base schema for organization unit."""

    name: str = Field(..., description="Organization name", min_length=1, max_length=100)
    code: str = Field(..., description="Unique organization code", min_length=1, max_length=50)
    type: OrgUnitTypeEnum = Field(..., description="Organization type")
    sort_order: int = Field(default=0, description="Sort order")
    leader_id: Optional[int] = Field(None, description="Leader user ID")


class OrgUnitCreate(OrgUnitBase):
    """Schema for creating organization unit."""

    parent_id: Optional[int] = Field(None, description="Parent organization ID")


class OrgUnitUpdate(BaseModel):
    """Schema for updating organization unit."""

    name: Optional[str] = Field(None, description="Organization name", min_length=1, max_length=100)
    sort_order: Optional[int] = Field(None, description="Sort order")
    leader_id: Optional[int] = Field(None, description="Leader user ID")


class OrgUnitResponse(BaseModel):
    """Schema for organization unit response."""

    id: int
    name: str
    code: str
    type: OrgUnitTypeEnum
    parent_id: Optional[int] = None
    level: int
    sort_order: int
    leader_id: Optional[int] = None
    status: OrgUnitStatusEnum
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrgUnitTreeItem(BaseModel):
    """Schema for tree item in organization tree."""

    id: int
    name: str
    code: str
    type: OrgUnitTypeEnum
    level: int
    sort_order: int
    leader_id: Optional[int] = None
    status: OrgUnitStatusEnum
    children: List["OrgUnitTreeItem"] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# Update forward reference
OrgUnitTreeItem.model_rebuild()


class OrgUnitStatusUpdate(BaseModel):
    """Schema for updating organization unit status."""

    status: OrgUnitStatusEnum = Field(..., description="Target status")


# ==================== Employee Schemas ====================


class EmployeeBase(BaseModel):
    """Base schema for employee."""

    employee_no: str = Field(..., description="Employee number", min_length=1, max_length=50)
    name: Optional[str] = Field(None, description="Employee name (synced from user if not provided)")
    phone: Optional[str] = Field(None, description="Phone number (synced from user if not provided)")
    email: Optional[str] = Field(None, description="Email", max_length=100)
    position: Optional[str] = Field(None, description="Position", max_length=100)
    primary_unit_id: Optional[int] = Field(None, description="Primary organization unit ID")
    entry_date: Optional[date] = Field(None, description="Entry date")


class UserSimple(BaseModel):
    """Simple user info for employee response."""

    id: int
    phone: str

    model_config = {"from_attributes": True}


class EmployeeCreate(EmployeeBase):
    """Schema for creating employee."""

    user_id: int = Field(..., description="Associated user ID", gt=0)
    secondary_unit_ids: Optional[List[int]] = Field(default_factory=list, description="Secondary organization unit IDs")
    status: Optional[EmployeeStatusEnum] = Field(None, description="Employee status")


class EmployeeUpdate(BaseModel):
    """Schema for updating employee."""

    name: Optional[str] = Field(None, description="Employee name", min_length=1, max_length=100)
    phone: Optional[str] = Field(None, description="Phone number", max_length=20)
    email: Optional[str] = Field(None, description="Email", max_length=100)
    position: Optional[str] = Field(None, description="Position", max_length=100)
    primary_unit_id: Optional[int] = Field(None, description="Primary organization unit ID")
    entry_date: Optional[date] = Field(None, description="Entry date")
    status: Optional[EmployeeStatusEnum] = Field(None, description="Employee status")

    @field_validator("primary_unit_id", mode="before")
    @classmethod
    def validate_primary_unit_id(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            return None
        return v


class OrgUnitSimple(BaseModel):
    """Simple organization unit info for employee response."""

    id: int
    name: str
    code: str
    type: OrgUnitTypeEnum

    model_config = {"from_attributes": True}


class EmployeeListItem(BaseModel):
    """Schema for employee list item."""

    id: int
    employee_no: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None
    primary_unit: Optional[OrgUnitSimple] = None
    secondary_units: List[OrgUnitSimple] = Field(default_factory=list)
    status: EmployeeStatusEnum
    entry_date: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    """Schema for employee list response."""

    total: int
    page: int
    page_size: int
    list: List[EmployeeListItem]


class EmployeeResponse(BaseModel):
    """Schema for employee response."""

    id: int
    employee_no: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None
    primary_unit: Optional[OrgUnitSimple] = None
    secondary_units: List[OrgUnitSimple] = Field(default_factory=list)
    user: Optional[UserSimple] = None
    status: EmployeeStatusEnum
    entry_date: Optional[date] = None
    dimission_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ==================== Employee Transfer Schemas ====================


class EmployeeTransferRequest(BaseModel):
    """Schema for employee transfer request."""

    to_unit_id: int = Field(..., description="Target organization unit ID", gt=0)
    transfer_type: TransferTypeEnum = Field(..., description="Transfer type")
    effective_date: date = Field(..., description="Effective date")
    reason: Optional[str] = Field(None, description="Transfer reason", max_length=500)


class EmployeeTransferResponse(BaseModel):
    """Schema for employee transfer response."""

    id: int
    employee_id: int
    from_unit: Optional[OrgUnitSimple] = None
    to_unit: OrgUnitSimple
    transfer_type: TransferTypeEnum
    effective_date: date
    reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ==================== Pagination Schemas ====================


class PaginatedResponse(BaseModel):
    """Base paginated response."""

    total: int
    page: int
    page_size: int
