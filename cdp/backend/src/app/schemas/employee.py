"""员工 Schemas"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.employee import EmployeeStatus
from app.models.employee_transfer import TransferType


class EmployeeCreate(BaseModel):
    employee_no: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    primary_unit_id: Optional[int] = None
    entry_date: Optional[date] = None
    secondary_unit_ids: list[int] = []
    user_id: Optional[int] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    primary_unit_id: Optional[int] = None
    entry_date: Optional[date] = None
    secondary_unit_ids: Optional[list[int]] = None


class EmployeeBindUser(BaseModel):
    user_id: int


class EmployeeTransferCreate(BaseModel):
    to_unit_id: int
    transfer_type: TransferType
    effective_date: date
    reason: Optional[str] = Field(None, max_length=500)


class UserMappingResponse(BaseModel):
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeResponse(BaseModel):
    id: int
    employee_no: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None
    primary_unit_id: Optional[int] = None
    status: EmployeeStatus
    entry_date: Optional[date] = None
    dimission_date: Optional[date] = None
    secondary_unit_ids: list[int] = []
    user_mapping: Optional[UserMappingResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeeTransferResponse(BaseModel):
    id: int
    employee_id: int
    from_unit_id: Optional[int] = None
    to_unit_id: int
    transfer_type: TransferType
    effective_date: date
    reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListQuery(BaseModel):
    unit_id: Optional[int] = None
    include_subordinates: bool = False
    status: Optional[EmployeeStatus] = None
    keyword: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page: int
    page_size: int
