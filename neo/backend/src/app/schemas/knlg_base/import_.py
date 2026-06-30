"""Knowledge Import (knlg_document, knlg_import_job) Pydantic schemas.

Note: filename is import_.py to avoid Python keyword conflict with 'import'.
"""

from datetime import datetime

from pydantic import BaseModel, Field

# ============ Document (Source) ============


class DocumentResponse(BaseModel):
    id: int
    name: str
    type: str
    source_url: str | None
    file_path: str | None
    file_size: int | None
    hash: str | None
    metadata_: dict | None = Field(None, alias="metadata")
    workspace_id: int
    imported_by: int
    imported_at: datetime
    import_job_count: int | None = Field(
        None,
        description="Number of import jobs associated with this document",
    )

    model_config = {"from_attributes": True}


class DocumentListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    type: str | None = None


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Note: Document upload uses multipart/form-data, not a JSON schema.
# The upload endpoint accepts: file (binary), name (string), type (string).


# ============ Import Job ============


class ImportJobCreate(BaseModel):
    document_id: int = Field(..., description="Source document ID")


class ImportJobStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        description="pending / parsing / classifying / extracting / completed / failed",
    )
    progress: float | None = Field(default=None, ge=0.0, le=1.0)
    error_message: str | None = None


class ImportJobResponse(BaseModel):
    id: int
    document_id: int
    status: str
    progress: float
    started_at: datetime | None
    finished_at: datetime | None
    result_summary: dict | None
    error_message: str | None
    workspace_id: int
    created_at: datetime
    updated_at: datetime
    parsed_chunks: list["ParsedChunkResponse"] | None = Field(
        None,
        description="Parsed chunks (only in detail response)",
    )

    model_config = {"from_attributes": True}


class ImportJobListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    document_id: int | None = None
    status: str | None = None


class ImportJobListResponse(BaseModel):
    items: list[ImportJobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ImportJobCancelResponse(BaseModel):
    id: int
    status: str
    finished_at: datetime
    error_message: str

    model_config = {"from_attributes": True}


# ============ Parsed Chunk (READ-ONLY in P0) ============


class ParsedChunkResponse(BaseModel):
    id: int
    job_id: int
    content: str
    category: str
    key_signals: list[str] | None
    confidence_hint: float
    chunk_order: int
    workspace_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ParsedChunkListResponse(BaseModel):
    items: list[ParsedChunkResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Resolve forward references
ImportJobResponse.model_rebuild()
