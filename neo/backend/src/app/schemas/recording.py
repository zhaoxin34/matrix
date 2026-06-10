"""Recording schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.recording import RecordingSource, RecordingStatus


class SegmentBase(BaseModel):
    """Base segment schema."""

    uid: str
    sequence: int
    start_time: datetime
    end_time: Optional[datetime] = None
    page_urls: list[str] = []
    size: int


class SegmentResponse(SegmentBase):
    """Segment response schema."""

    pass


class SegmentDetailResponse(SegmentBase):
    """Segment detail response with storage key."""

    storage_key: str


class RecordingBase(BaseModel):
    """Base recording schema."""

    name: str = Field(..., max_length=128)
    tags: list[str] = []
    enter_url: Optional[str] = Field(None, max_length=2048)
    source: RecordingSource = RecordingSource.AGENT


class RecordingCreate(RecordingBase):
    """Recording create schema."""

    pass


class RecordingUpdate(BaseModel):
    """Recording update schema."""

    name: Optional[str] = Field(None, max_length=128)
    tags: Optional[list[str]] = None
    status: Optional[RecordingStatus] = None
    exit_url: Optional[str] = Field(None, max_length=2048)
    total_duration: Optional[int] = Field(None, ge=0)
    total_size: Optional[int] = Field(None, ge=0)


class RecordingResponse(BaseModel):
    """Recording response schema."""

    uid: str
    name: str
    tags: list[str]
    status: RecordingStatus
    enter_url: Optional[str] = None
    exit_url: Optional[str] = None
    total_duration: int
    total_size: int
    source: RecordingSource
    segment_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


class RecordingDetailResponse(RecordingResponse):
    """Recording detail response with segments."""

    segments: list[SegmentResponse] = []


class SegmentCreate(BaseModel):
    """Segment create schema."""

    start_time: datetime
    end_time: Optional[datetime] = None
    page_urls: list[str] = []
    storage_key: str = Field(..., max_length=512)
    size: int = Field(..., ge=0)


class SegmentCreateResponse(BaseModel):
    """Segment create response schema."""

    uid: str
    sequence: int


class PresignedUrlRequest(BaseModel):
    """Presigned URL request schema."""

    filename: str = Field(..., max_length=255)
    content_type: str = Field(default="application/json", max_length=100)


class PresignedUrlResponse(BaseModel):
    """Presigned URL response schema."""

    upload_url: str
    storage_key: str
    expires_in: int = 3600


class DownloadUrlResponse(BaseModel):
    """Download URL response schema."""

    download_url: str
    expires_in: int = 3600


class BatchTagsRequest(BaseModel):
    """Batch tags request schema."""

    uids: list[str] = Field(..., min_length=1)
    action: str = Field(..., pattern="^(add|remove)$")
    tags: list[str] = Field(..., min_length=1)


class BatchDeleteRequest(BaseModel):
    """Batch delete request schema."""

    uids: list[str] = Field(..., min_length=1)
