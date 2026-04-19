"""Address schema definitions."""

from app.schemas.common import BaseCreate, BaseResponse, BaseSchema, BaseUpdate


class AddressBase(BaseSchema):
    """Address base schema."""

    recipient_name: str
    phone: str
    province: str
    city: str
    district: str
    street: str
    is_default: bool = False


class AddressCreate(BaseCreate):
    """Address create schema."""

    recipient_name: str
    phone: str
    province: str
    city: str
    district: str
    street: str
    is_default: bool = False


class AddressUpdate(BaseUpdate):
    """Address update schema."""

    recipient_name: str | None = None
    phone: str | None = None
    province: str | None = None
    city: str | None = None
    district: str | None = None
    street: str | None = None
    is_default: bool | None = None


class AddressResponse(AddressBase, BaseResponse):
    """Address response schema."""

    id: int
    user_id: int
