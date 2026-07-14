"""Model Config Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class ModelConfigCreate(BaseModel):
    """Schema for creating a new Model Config."""

    model_id: str = Field(..., min_length=1, max_length=64, description="Model identifier (e.g., gpt-4)")
    display_name: str | None = Field(None, max_length=128, description="Display name")
    context_window: int = Field(default=128000, ge=1, description="Context window size in tokens")
    max_tokens: int = Field(default=4096, ge=1, description="Maximum output tokens")
    supports_thinking: bool = Field(default=False, description="Whether the model supports thinking")
    thinking_level_map: dict | None = Field(None, description="Thinking level mapping")
    input_types: list[str] = Field(default=["text"], description="Supported input types: text, image")


class ModelConfigUpdate(BaseModel):
    """Schema for updating a Model Config."""

    display_name: str | None = Field(None, max_length=128, description="Display name")
    context_window: int | None = Field(None, ge=1, description="Context window size in tokens")
    max_tokens: int | None = Field(None, ge=1, description="Maximum output tokens")
    supports_thinking: bool | None = Field(None, description="Whether the model supports thinking")
    thinking_level_map: dict | None = Field(None, description="Thinking level mapping")
    input_types: list[str] | None = Field(None, description="Supported input types: text, image")


class ModelConfigResponse(BaseModel):
    """Schema for Model Config response."""

    id: int
    provider_id: int
    model_id: str
    display_name: str | None
    context_window: int
    max_tokens: int
    supports_thinking: bool
    thinking_level_map: dict | None
    input_types: list[str]
    enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ModelConfigListResponse(BaseModel):
    """Schema for Model Config list response."""

    items: list[ModelConfigResponse]
    total: int
    page: int
    page_size: int


class ModelConfigWithProviderResponse(ModelConfigResponse):
    """Schema for Model Config response with provider info."""

    provider_code: str | None = None
    provider_name: str | None = None
