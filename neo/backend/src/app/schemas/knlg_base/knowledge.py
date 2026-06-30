"""Knowledge Base (knlg_knowledge_card) Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, Field

# ============ Request Schemas ============


class KnowledgeCardCreate(BaseModel):
    """Schema for creating a new Knowledge Card."""

    title: str = Field(..., min_length=1, max_length=255, description="Card title")
    statement: str = Field(..., min_length=1, description="Core statement")
    domain: str = Field(..., min_length=1, max_length=64, description="Knowledge domain")
    tags: list[str] | None = Field(None, description="Tag list")
    type: str = Field(
        ...,
        description="Type: judgement / risk / opportunity / process / communication / competitive",
    )
    key_signals: list[str] | None = Field(None, description="Key signal list")
    conditions: str | None = Field(None, description="Applicable conditions (natural language)")
    exceptions: str | None = Field(None, description="Exceptions and edge cases")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0, description="Confidence 0-1")
    source_turn_ids: list[int] | None = Field(None, description="Source interview turn IDs")
    source_doc_ids: list[int] | None = Field(None, description="Source document IDs")
    source_pattern_ids: list[int] | None = Field(None, description="Source data pattern IDs")
    expert_ids: list[int] | None = Field(None, description="Contributing expert IDs")


class KnowledgeCardUpdate(BaseModel):
    """Schema for updating a Knowledge Card (mutable fields only)."""

    title: str | None = Field(None, min_length=1, max_length=255)
    statement: str | None = Field(None, min_length=1)
    domain: str | None = Field(None, min_length=1, max_length=64)
    tags: list[str] | None = None
    type: str | None = None
    key_signals: list[str] | None = None
    conditions: str | None = None
    exceptions: str | None = None
    confidence: float | None = Field(None, ge=0.0, le=1.0)


class KnowledgeCardListQuery(BaseModel):
    """Query schema for listing knowledge cards."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    domain: str | None = Field(None, description="Filter by domain")
    type: str | None = Field(None, description="Filter by type")
    status: str | None = Field(None, description="Filter by status")
    validation_status: str | None = Field(None, description="Filter by validation status")
    keyword: str | None = Field(None, max_length=200, description="Search keyword")


class KnowledgeCardStatusUpdate(BaseModel):
    """Schema for status transition requests."""

    target_status: str = Field(..., description="Target status")


# ============ Response Schemas ============


class KnowledgeCardResponse(BaseModel):
    """Schema for knowledge card response."""

    id: int
    title: str
    statement: str
    domain: str
    tags: list[str] | None
    type: str
    key_signals: list[str] | None
    conditions: str | None
    exceptions: str | None
    confidence: float
    confidence_breakdown: dict | None
    validation_status: str
    source_turn_ids: list[int] | None
    source_doc_ids: list[int] | None
    source_pattern_ids: list[int] | None
    expert_ids: list[int] | None
    status: str
    version: str
    published_at: datetime | None
    workspace_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeCardListResponse(BaseModel):
    """Schema for paginated knowledge card list."""

    items: list[KnowledgeCardResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SourceRefResponse(BaseModel):
    """Schema for source reference response."""

    id: int
    kc_id: int
    source_type: str
    source_id: int
    source_excerpt: str | None
    contribution_weight: float
    workspace_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeCardVersionResponse(BaseModel):
    """Schema for knowledge card version response."""

    id: int
    kc_id: int
    version: str
    snapshot: dict
    change_note: str | None
    changed_by: int
    workspace_id: int
    created_at: datetime

    model_config = {"from_attributes": True}
