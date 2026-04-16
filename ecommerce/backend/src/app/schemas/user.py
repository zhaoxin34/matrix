"""User schema definitions."""

from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.schemas.common import BaseCreate, BaseResponse, BaseSchema, BaseUpdate


class UserBase(BaseSchema):
    """User base schema."""

    username: str
    email: EmailStr
    is_admin: bool = False


class UserCreate(BaseCreate):
    """User create schema."""

    username: str
    email: EmailStr
    password: str


class UserUpdate(BaseUpdate):
    """User update schema."""

    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None


class UserResponse(UserBase, BaseResponse):
    """User response schema."""

    id: int
    created_at: datetime
    updated_at: datetime


class UserLogin(BaseModel):
    """User login schema."""

    username: str
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""

    access_token: str
    token_type: str = "bearer"
