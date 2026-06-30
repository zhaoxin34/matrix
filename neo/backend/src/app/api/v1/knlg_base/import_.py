"""Knowledge Import API endpoints: Document upload, ImportJob CRUD."""

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.knlg_base import (
    DocumentListResponse,
    DocumentResponse,
    ImportJobCancelResponse,
    ImportJobCreate,
    ImportJobListResponse,
    ImportJobResponse,
    ImportJobStatusUpdate,
    ParsedChunkListResponse,
    ParsedChunkResponse,
)
from app.schemas.response import ApiResponse
from app.services.knlg_base.import_ import (
    KnlgDocumentService,
    KnlgImportJobService,
)

router = APIRouter(prefix="/import", tags=["knlg-base.import"])


def get_doc_service(db: Session = Depends(get_db)) -> KnlgDocumentService:
    return KnlgDocumentService(db)


def get_job_service(db: Session = Depends(get_db)) -> KnlgImportJobService:
    return KnlgImportJobService(db)


# ==================== Documents ====================


@router.get("/documents", response_model=ApiResponse[DocumentListResponse])
def list_documents(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    type: str | None = None,
    service: KnlgDocumentService = Depends(get_doc_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_documents(workspace_code, current_user, page, page_size, type)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return ApiResponse.success(
        DocumentListResponse(
            items=[DocumentResponse.model_validate(d) for d in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("/upload", response_model=ApiResponse[DocumentResponse])
async def upload_document(
    workspace_code: str,
    file: UploadFile = File(..., description="Document file"),
    name: str = Form(...),
    type: str = Form(...),
    source_url: str | None = Form(None),
    service: KnlgDocumentService = Depends(get_doc_service),
    current_user: User = Depends(get_current_user),
):
    """Upload a document (multipart/form-data)."""
    file_bytes = await file.read()
    doc = service.upload_document(workspace_code, current_user, file_bytes, name, type, source_url)
    return ApiResponse.success(DocumentResponse.model_validate(doc))


@router.get("/documents/{doc_id}", response_model=ApiResponse[DocumentResponse])
def get_document(
    workspace_code: str,
    doc_id: int,
    service: KnlgDocumentService = Depends(get_doc_service),
    current_user: User = Depends(get_current_user),
):
    doc = service.get_document(workspace_code, current_user, doc_id)
    return ApiResponse.success(DocumentResponse.model_validate(doc))


@router.delete("/documents/{doc_id}")
def delete_document(
    workspace_code: str,
    doc_id: int,
    service: KnlgDocumentService = Depends(get_doc_service),
    current_user: User = Depends(get_current_user),
):
    service.delete_document(workspace_code, current_user, doc_id)
    return ApiResponse.success(None)


# ==================== Import Jobs ====================


@router.get("/jobs", response_model=ApiResponse[ImportJobListResponse])
def list_jobs(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    document_id: int | None = None,
    status: str | None = None,
    service: KnlgImportJobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_jobs(workspace_code, current_user, page, page_size, document_id, status)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return ApiResponse.success(
        ImportJobListResponse(
            items=[ImportJobResponse.model_validate(j) for j in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("/jobs", response_model=ApiResponse[ImportJobResponse])
def create_job(
    workspace_code: str,
    data: ImportJobCreate,
    service: KnlgImportJobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    job = service.create_job(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(ImportJobResponse.model_validate(job))


@router.get("/jobs/{job_id}", response_model=ApiResponse[ImportJobResponse])
def get_job(
    workspace_code: str,
    job_id: int,
    service: KnlgImportJobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    job = service.get_job(workspace_code, current_user, job_id)
    return ApiResponse.success(ImportJobResponse.model_validate(job))


@router.patch("/jobs/{job_id}/status", response_model=ApiResponse[ImportJobResponse])
def update_job_status(
    workspace_code: str,
    job_id: int,
    data: ImportJobStatusUpdate,
    service: KnlgImportJobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    job = service.update_status(
        workspace_code,
        current_user,
        job_id,
        data.status,
        data.progress,
        data.error_message,
    )
    return ApiResponse.success(ImportJobResponse.model_validate(job))


@router.post("/jobs/{job_id}/cancel", response_model=ApiResponse[ImportJobCancelResponse])
def cancel_job(
    workspace_code: str,
    job_id: int,
    service: KnlgImportJobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    job = service.cancel_job(workspace_code, current_user, job_id)
    return ApiResponse.success(ImportJobCancelResponse.model_validate(job))


@router.delete("/jobs/{job_id}")
def delete_job(
    workspace_code: str,
    job_id: int,
    service: KnlgImportJobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    service.delete_job(workspace_code, current_user, job_id)
    return ApiResponse.success(None)


@router.get("/jobs/{job_id}/chunks", response_model=ApiResponse[ParsedChunkListResponse])
def list_chunks(
    workspace_code: str,
    job_id: int,
    category: str | None = None,
    service: KnlgImportJobService = Depends(get_job_service),
    current_user: User = Depends(get_current_user),
):
    chunks = service.list_chunks(workspace_code, current_user, job_id, category)
    total = len(chunks)
    return ApiResponse.success(
        ParsedChunkListResponse(
            items=[ParsedChunkResponse.model_validate(c) for c in chunks],
            total=total,
            page=1,
            page_size=total if total > 0 else 20,
            total_pages=1,
        )
    )
