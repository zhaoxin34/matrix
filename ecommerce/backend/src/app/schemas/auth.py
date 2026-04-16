"""Authentication schemas."""

import re
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class UserRegister(BaseModel):
    """User registration schema."""

    username: Annotated[str, Field(min_length=2, max_length=50)]
    phone: Annotated[str, Field(pattern=r"^1[3-9]\d{9}$")]
    password: Annotated[str, Field(min_length=8)]
    email: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password complexity: letter + number."""
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("密码必须包含字母")
        if not re.search(r"\d", v):
            raise ValueError("密码必须包含数字")
        return v


class UserLogin(BaseModel):
    """User login schema."""

    phone: str
    password: str


class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: int  # user_id
    exp: datetime
    iat: datetime
    type: str = "access"  # "access" or "refresh"


class TokenResponse(BaseModel):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""

    phone: Annotated[str, Field(pattern=r"^1[3-9]\d{9}$")]


class PasswordResetConfirm(BaseModel):
    """Password reset confirm schema."""

    phone: Annotated[str, Field(pattern=r"^1[3-9]\d{9}$")]
    code: Annotated[str, Field(min_length=6, max_length=6)]
    new_password: Annotated[str, Field(min_length=8)]

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password complexity: letter + number."""
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("密码必须包含字母")
        if not re.search(r"\d", v):
            raise ValueError("密码必须包含数字")
        return v


class SMSCodeRequest(BaseModel):
    """SMS code request schema."""

    phone: Annotated[str, Field(pattern=r"^1[3-9]\d{9}$")]


class SMSCodeVerify(BaseModel):
    """SMS code verify schema."""

    phone: Annotated[str, Field(pattern=r"^1[3-9]\d{9}$")]
    code: Annotated[str, Field(min_length=6, max_length=6)]


class UserResponse(BaseModel):
    """User response schema."""

    id: int
    username: str
    phone: str | None = None
    email: str | None = None

    class Config:
        from_attributes = True
