"""Authentication schemas."""

from pydantic import BaseModel, Field, field_validator


class SendCodeRequest(BaseModel):
    """Request schema for sending verification code."""

    phone: str = Field(
        ...,
        description="Phone number",
        min_length=11,
        max_length=11,
        examples=["13800138001"],
    )
    type: str = Field(
        ...,
        description="Code type: register, login, reset_password",
        pattern=r"^(register|login|reset_password)$",
    )

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not v.startswith("1"):
            raise ValueError("Phone number must start with 1")
        if not v.isdigit():
            raise ValueError("Phone number must contain only digits")
        return v


class RegisterRequest(BaseModel):
    """Request schema for user registration."""

    phone: str = Field(
        ...,
        description="Phone number",
        min_length=11,
        max_length=11,
        examples=["13800138001"],
    )
    code: str = Field(
        ...,
        description="Verification code",
        min_length=6,
        max_length=6,
        examples=["123456"],
    )
    password: str = Field(
        ...,
        description="Password (8-20 chars, must contain letters and numbers)",
        min_length=8,
        max_length=20,
        examples=["abcd1234"],
    )
    username: str | None = Field(
        None,
        description="Display name (optional)",
        max_length=50,
        examples=["张三"],
    )

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not v.startswith("1"):
            raise ValueError("Phone number must start with 1")
        if not v.isdigit():
            raise ValueError("Phone number must contain only digits")
        return v

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Verification code must contain only digits")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        has_letter = any(c.isalpha() for c in v)
        has_digit = any(c.isdigit() for c in v)
        if not (has_letter and has_digit):
            raise ValueError("Password must contain both letters and numbers")
        return v


class LoginRequest(BaseModel):
    """Request schema for user login."""

    phone: str = Field(
        ...,
        description="Phone number",
        min_length=11,
        max_length=11,
        examples=["13800138001"],
    )
    password: str = Field(
        ...,
        description="Password",
        min_length=1,
        max_length=100,
        examples=["abcd1234"],
    )


class AuthResponse(BaseModel):
    """Response schema for authentication."""

    user_id: int = Field(..., description="User ID")
    token: str = Field(..., description="Access token")


class SendCodeResponse(BaseModel):
    """Response schema for send code."""

    expires_in: int = Field(300, description="Code expiration time in seconds")
