"""Pydantic schemas for embedded sites."""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.embedded_site import EmbeddedSiteStatus


class EmbeddedSiteBase(BaseModel):
    """Base schema for embedded site."""

    site_name: str = Field(..., max_length=255, description="Website name")
    site_url: str = Field(..., max_length=512, description="Website URL")
    description: Optional[str] = Field(None, description="Website description")

    @field_validator("site_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Validate that site_url is a valid URL format."""
        url_pattern = re.compile(
            r"^https?://"  # http:// or https://
            r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"  # domain
            r"localhost|"  # localhost
            r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # IP
            r"(?::\d+)?"  # optional port
            r"(?:/?|[/?]\S+)$",  # optional path
            re.IGNORECASE,
        )
        if not url_pattern.match(v):
            raise ValueError("Invalid URL format. Must start with http:// or https://")
        return v


class EmbeddedSiteCreate(EmbeddedSiteBase):
    """Schema for creating an embedded site."""

    pass


class EmbeddedSiteUpdate(BaseModel):
    """Schema for updating an embedded site."""

    site_name: Optional[str] = Field(None, max_length=255)
    site_url: Optional[str] = Field(None, max_length=512)
    description: Optional[str] = None
    status: Optional[EmbeddedSiteStatus] = None

    @field_validator("site_url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate that site_url is a valid URL format if provided."""
        if v is None:
            return v
        url_pattern = re.compile(
            r"^https?://"
            r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
            r"localhost|"
            r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
            r"(?::\d+)?"
            r"(?:/?|[/?]\S+)$",
            re.IGNORECASE,
        )
        if not url_pattern.match(v):
            raise ValueError("Invalid URL format. Must start with http:// or https://")
        return v


class EmbeddedSiteResponse(EmbeddedSiteBase):
    """Schema for embedded site response."""

    id: int
    workspace_id: int
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmbeddedSiteListResponse(BaseModel):
    """Schema for embedded site list response with pagination."""

    items: list[EmbeddedSiteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EmbeddedSiteStatusResponse(BaseModel):
    """Schema for status toggle response."""

    id: int
    status: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
