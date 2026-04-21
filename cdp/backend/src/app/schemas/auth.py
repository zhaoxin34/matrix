"""Authentication schemas."""

from pydantic import BaseModel, Field, field_validator
from typing import Annotated


class UserRegister(BaseModel):
    """User registration schema."""

    username: Annotated[str, Field(min_length=2, max_length=50)]
    email: Annotated[str, Field(min_length=5, max_length=100)]
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

    username: str
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

    class Config:
        from_attributes = True
