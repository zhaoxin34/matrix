"""Model Provider Pydantic schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ApiType(str, Enum):
    """Supported API types for model providers."""

    OPENAI_COMPLETIONS = "openai-completions"
    OPENAI_RESPONSES = "openai-responses"
    ANTHROPIC_MESSAGES = "anthropic-messages"
    GOOGLE_GENERATIVE_AI = "google-generative-ai"


class ModelProviderCreate(BaseModel):
    """Schema for creating a new Model Provider."""

    code: str = Field(..., min_length=1, max_length=32, description="Provider code (unique identifier)")
    name: str = Field(..., min_length=1, max_length=64, description="Display name")
    description: str | None = Field(None, max_length=500, description="Description")
    api_type: ApiType = Field(..., description="API type")
    base_url: str | None = Field(None, max_length=512, description="API endpoint URL")
    api_key_env: str | None = Field(None, max_length=128, description="Environment variable name for API Key")
    headers: dict | None = Field(None, description="Custom request headers")

    @field_validator("api_key_env")
    @classmethod
    def validate_api_key_env(cls, v: str | None) -> str | None:
        """Validate environment variable format."""
        if v is not None and v:
            # Must be uppercase with underscores
            if not v.replace("_", "").isalnum() or not v[0].isalpha():
                raise ValueError(
                    "api_key_env must be a valid environment variable name (uppercase letters, digits, underscores)"
                )
        return v


class ModelProviderUpdate(BaseModel):
    """Schema for updating a Model Provider."""

    name: str | None = Field(None, min_length=1, max_length=64, description="Display name")
    description: str | None = Field(None, max_length=500, description="Description")
    api_type: ApiType | None = Field(None, description="API type")
    base_url: str | None = Field(None, max_length=512, description="API endpoint URL")
    api_key_env: str | None = Field(None, max_length=128, description="Environment variable name for API Key")
    headers: dict | None = Field(None, description="Custom request headers")


class ModelProviderResponse(BaseModel):
    """Schema for Model Provider response."""

    id: int
    code: str
    name: str
    description: str | None
    api_type: str
    base_url: str | None
    api_key_env: str | None
    headers: dict | None
    enabled: bool
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ModelProviderListResponse(BaseModel):
    """Schema for Model Provider list response."""

    items: list[ModelProviderResponse]
    total: int
    page: int
    page_size: int


class ModelProviderListQuery(BaseModel):
    """Schema for listing Model Providers with filters."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    enabled: bool | None = Field(None, description="Filter by enabled status")
    for_agent: bool = Field(default=False, description="Filter for agent creation")


class ModelProviderStatusResponse(BaseModel):
    """Schema for status update response."""

    id: int
    enabled: bool
    updated_at: datetime

    model_config = {"from_attributes": True}
