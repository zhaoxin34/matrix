"""Authentication schemas."""

from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class UserRegister(BaseModel):
    """User registration schema."""

    username: Annotated[str, Field(min_length=2, max_length=50)]
    email: Annotated[str, Field(min_length=5, max_length=100)]
    phone: Annotated[str, Field(min_length=11, max_length=20)]
    password: Annotated[str, Field(min_length=8)]

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password complexity: letter + number."""
        if not any(c.isalpha() for c in v):
            raise ValueError("密码必须包含字母")
        if not any(c.isdigit() for c in v):
            raise ValueError("密码必须包含数字")
        return v


class UserLogin(BaseModel):
    """User login schema."""

    phone: str
    password: str


class TokenResponse(BaseModel):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User response schema."""

    id: int
    username: str
    email: str | None = None
    phone: str | None = None
    is_admin: bool = False

    class Config:
        from_attributes = True


class SmsSendRequest(BaseModel):
    """SMS send request schema."""

    phone: Annotated[str, Field(pattern=r"^1[3-9]\d{9}$")]
