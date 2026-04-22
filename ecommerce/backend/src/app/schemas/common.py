"""Common schema definitions."""

from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with common configuration."""

    model_config = ConfigDict(from_attributes=True)


class BaseCreate(BaseModel):
    """Base schema for create operations."""

    pass


class BaseUpdate(BaseModel):
    """Base schema for update operations."""

    pass


class BaseResponse(BaseModel):
    """Base schema for response."""

    pass


class PaginatedResponse(BaseSchema, Generic[T]):
    """Paginated response schema."""

    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int
