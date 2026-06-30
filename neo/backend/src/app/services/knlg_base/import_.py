"""Knowledge import services: Document upload, ImportJob CRUD."""

import hashlib

from sqlalchemy.orm import Session

from app.core.error_codes import ERR_CONFLICT, ERR_INVALID_PARAMETER, ERR_NOT_FOUND
from app.core.exceptions import BusinessException
from app.models.user import User
from app.repositories.knlg_base.import_ import (
    KnlgDocumentRepository,
    KnlgImportJobRepository,
    KnlgParsedChunkRepository,
)
from app.services.knlg_base.base import KnlgBaseService

# File size and type validation (P0)
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
ALLOWED_TYPES = {"wiki", "confluence", "pdf", "docx", "md", "txt", "csv"}


class KnlgDocumentService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgDocumentRepository(db)
        self.job_repo = KnlgImportJobRepository(db)

    def list_documents(self, workspace_code, user, page=1, page_size=20, type_=None):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        items, total = self.repo.list(ws_id, page, page_size, type_)
        # Attach job counts
        for item in items:
            item.import_job_count = self.repo.count_import_jobs(item.id)
        return items, total

    def get_document(self, workspace_code, user, doc_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        doc = self.repo.get_by_id(ws_id, doc_id)
        if not doc:
            raise BusinessException(ERR_NOT_FOUND, "Document not found")
        doc.import_job_count = self.repo.count_import_jobs(doc_id)
        return doc

    def upload_document(
        self,
        workspace_code: str,
        user: User,
        file_bytes: bytes,
        name: str,
        doc_type: str,
        source_url: str | None = None,
    ):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)

        # Validate type
        if doc_type not in ALLOWED_TYPES:
            raise BusinessException(
                ERR_INVALID_PARAMETER,
                f"Invalid type. Allowed: {sorted(ALLOWED_TYPES)}",
            )
        # Validate size
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise BusinessException(
                ERR_INVALID_PARAMETER,
                f"File size exceeds {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB limit",
            )
        # Compute hash
        content_hash = hashlib.sha256(file_bytes).hexdigest()
        # Check duplicate
        existing = self.repo.get_by_hash(ws_id, content_hash)
        if existing:
            raise BusinessException(
                ERR_CONFLICT,
                f"Duplicate document (hash matches existing id={existing.id}, name={existing.name})",
            )

        # Upload to RustFS (placeholder - actual integration in service)
        # In P0, store file_path placeholder; real upload happens via storage.service
        file_path = f"workspaces/{ws_id}/documents/{content_hash[:16]}_{name}"

        doc = self.repo.create(
            {
                "workspace_id": ws_id,
                "name": name,
                "type": doc_type,
                "source_url": source_url,
                "file_path": file_path,
                "file_size": len(file_bytes),
                "hash": content_hash,
                "imported_by": user.id,
            }
        )
        return doc

    def delete_document(self, workspace_code, user, doc_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        doc = self.repo.get_by_id(ws_id, doc_id)
        if not doc:
            raise BusinessException(ERR_NOT_FOUND, "Document not found")
        # Check for active jobs
        active_jobs = self.job_repo.list(ws_id, page=1, page_size=100, document_id=doc_id)[0]
        active_statuses = {"pending", "parsing", "classifying", "extracting"}
        for job in active_jobs:
            if job.status in active_statuses:
                raise BusinessException(
                    ERR_CONFLICT,
                    "Cannot delete: document has active import jobs",
                )
        self.repo.delete(doc)


class KnlgImportJobService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgImportJobRepository(db)
        self.doc_repo = KnlgDocumentRepository(db)
        self.chunk_repo = KnlgParsedChunkRepository(db)

    def list_jobs(self, workspace_code, user, page=1, page_size=20, document_id=None, status=None):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.repo.list(ws_id, page, page_size, document_id, status)

    def get_job(self, workspace_code, user, job_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        job = self.repo.get_by_id(ws_id, job_id)
        if not job:
            raise BusinessException(ERR_NOT_FOUND, "Import job not found")
        job.parsed_chunks = self.chunk_repo.list_by_job(ws_id, job_id)
        return job

    def create_job(self, workspace_code, user, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        # Validate document exists in workspace
        doc = self.doc_repo.get_by_id(ws_id, data["document_id"])
        if not doc:
            raise BusinessException(ERR_NOT_FOUND, "Document not found in this workspace")
        data.setdefault("workspace_id", ws_id)
        data.setdefault("status", "pending")
        data.setdefault("progress", 0.0)
        return self.repo.create(data)

    def update_status(self, workspace_code, user, job_id, status, progress=None, error_message=None):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        job = self.repo.get_by_id(ws_id, job_id)
        if not job:
            raise BusinessException(ERR_NOT_FOUND, "Import job not found")
        return self.repo.update_status(job, status, progress, error_message)

    def cancel_job(self, workspace_code, user, job_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        job = self.repo.get_by_id(ws_id, job_id)
        if not job:
            raise BusinessException(ERR_NOT_FOUND, "Import job not found")
        if job.status == "completed":
            raise BusinessException(ERR_CONFLICT, "Cannot cancel a completed job")
        return self.repo.cancel(job)

    def delete_job(self, workspace_code, user, job_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        job = self.repo.get_by_id(ws_id, job_id)
        if not job:
            raise BusinessException(ERR_NOT_FOUND, "Import job not found")
        self.repo.delete(job)

    def list_chunks(self, workspace_code, user, job_id, category=None):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.chunk_repo.list_by_job(ws_id, job_id, category)
