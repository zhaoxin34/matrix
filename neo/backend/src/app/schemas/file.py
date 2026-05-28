"""File schemas for API request/response validation."""

from datetime import datetime

from pydantic import BaseModel, Field


class FileMetadataItem(BaseModel):
    """File metadata item for tree response."""

    id: int
    name: str
    path: str
    type: str  # "file" or "directory"
    size: int | None = None
    children: list["FileMetadataItem"] | None = None

    model_config = {"from_attributes": True}


class FileMetadataCreate(BaseModel):
    """Request schema for creating a file."""

    path: str = Field(..., min_length=1, max_length=512, description="File path")
    content: str = Field(default="", description="File content")


class FileMetadataUpdate(BaseModel):
    """Request schema for updating a file."""

    content: str = Field(..., description="File content")


class FileMetadataResponse(BaseModel):
    """Response schema for file metadata."""

    id: int
    name: str
    path: str
    size: int
    version: int
    created_at: datetime


class FileContentResponse(BaseModel):
    """Response schema for file content."""

    id: int
    name: str
    path: str
    size: int
    content: str
    version: int
    updated_at: datetime


class FileCreateResponse(BaseModel):
    """Response schema for file creation."""

    id: int
    name: str
    path: str
    size: int
    version: int
    created_at: datetime


class FileUpdateResponse(BaseModel):
    """Response schema for file update."""

    id: int
    name: str
    path: str
    size: int
    version: int
    updated_at: datetime


class FileDeleteResponse(BaseModel):
    """Response schema for file deletion."""

    success: bool = True
