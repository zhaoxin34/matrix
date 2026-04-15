"""Address schema definitions."""

from datetime import datetime

from app.schemas.common import BaseCreate, BaseResponse, BaseSchema, BaseUpdate


class AddressBase(BaseSchema):
    """Address base schema."""

    name: str
    phone: str
    address: str
    is_default: bool = False


class AddressCreate(BaseCreate):
    """Address create schema."""

    name: str
    phone: str
    address: str
    is_default: bool = False


class AddressUpdate(BaseUpdate):
    """Address update schema."""

    name: str | None = None
    phone: str | None = None
    address: str | None = None
    is_default: bool | None = None


class AddressResponse(AddressBase, BaseResponse):
    """Address response schema."""

    id: int
    user_id: int
    created_at: datetime
