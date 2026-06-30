"""Knowledge import repositories: Document, ImportJob, ParsedChunk."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.knlg_document import KnlgDocument
from app.models.knlg_import_job import KnlgImportJob
from app.models.knlg_parsed_chunk import KnlgParsedChunk


class KnlgDocumentRepository:
    """Repository for source documents."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, doc_id: int) -> KnlgDocument | None:
        return (
            self.session.query(KnlgDocument)
            .filter(
                KnlgDocument.workspace_id == workspace_id,
                KnlgDocument.id == doc_id,
            )
            .first()
        )

    def get_by_hash(self, workspace_id: int, hash_: str) -> KnlgDocument | None:
        return (
            self.session.query(KnlgDocument)
            .filter(
                KnlgDocument.workspace_id == workspace_id,
                KnlgDocument.hash == hash_,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgDocument:
        doc = KnlgDocument(**data)
        self.session.add(doc)
        self.session.flush()
        self.session.refresh(doc)
        return doc

    def delete(self, doc: KnlgDocument) -> None:
        self.session.delete(doc)
        self.session.flush()

    def count_import_jobs(self, doc_id: int) -> int:
        return self.session.query(KnlgImportJob).filter(KnlgImportJob.document_id == doc_id).count()

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        type_: str | None = None,
    ) -> tuple[list[KnlgDocument], int]:
        query = self.session.query(KnlgDocument).filter(KnlgDocument.workspace_id == workspace_id)
        if type_:
            query = query.filter(KnlgDocument.type == type_)
        query = query.order_by(KnlgDocument.imported_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total


class KnlgImportJobRepository:
    """Repository for import jobs."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, job_id: int) -> KnlgImportJob | None:
        return (
            self.session.query(KnlgImportJob)
            .filter(
                KnlgImportJob.workspace_id == workspace_id,
                KnlgImportJob.id == job_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgImportJob:
        job = KnlgImportJob(**data)
        self.session.add(job)
        self.session.flush()
        self.session.refresh(job)
        return job

    def delete(self, job: KnlgImportJob) -> None:
        self.session.delete(job)
        self.session.flush()

    def update_status(
        self,
        job: KnlgImportJob,
        status: str,
        progress: float | None = None,
        error_message: str | None = None,
    ) -> KnlgImportJob:
        from datetime import UTC, datetime

        job.status = status
        if progress is not None:
            job.progress = progress
        if error_message is not None:
            job.error_message = error_message
        if status == "parsing" and job.started_at is None:
            job.started_at = datetime.now(UTC)
        if status in ("completed", "failed") and job.finished_at is None:
            job.finished_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(job)
        return job

    def cancel(self, job: KnlgImportJob) -> KnlgImportJob:
        from datetime import UTC, datetime

        job.status = "failed"
        job.error_message = "Cancelled by user"
        job.finished_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(job)
        return job

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        document_id: int | None = None,
        status: str | None = None,
    ) -> tuple[list[KnlgImportJob], int]:
        query = self.session.query(KnlgImportJob).filter(KnlgImportJob.workspace_id == workspace_id)
        if document_id:
            query = query.filter(KnlgImportJob.document_id == document_id)
        if status:
            query = query.filter(KnlgImportJob.status == status)
        query = query.order_by(KnlgImportJob.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total

    def list_chunks_by_job(self, workspace_id: int, job_id: int, category: str | None = None) -> list[KnlgParsedChunk]:
        query = self.session.query(KnlgParsedChunk).filter(
            KnlgParsedChunk.workspace_id == workspace_id,
            KnlgParsedChunk.job_id == job_id,
        )
        if category:
            query = query.filter(KnlgParsedChunk.category == category)
        return query.order_by(KnlgParsedChunk.chunk_order.asc()).all()


class KnlgParsedChunkRepository:
    """Repository for parsed chunks (READ-ONLY in P0)."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, chunk_id: int) -> KnlgParsedChunk | None:
        return (
            self.session.query(KnlgParsedChunk)
            .filter(
                KnlgParsedChunk.workspace_id == workspace_id,
                KnlgParsedChunk.id == chunk_id,
            )
            .first()
        )

    def list_by_job(
        self,
        workspace_id: int,
        job_id: int,
        page: int = 1,
        page_size: int = 20,
        category: str | None = None,
    ) -> tuple[list[KnlgParsedChunk], int]:
        query = self.session.query(KnlgParsedChunk).filter(
            KnlgParsedChunk.workspace_id == workspace_id,
            KnlgParsedChunk.job_id == job_id,
        )
        if category:
            query = query.filter(KnlgParsedChunk.category == category)
        query = query.order_by(KnlgParsedChunk.chunk_order.asc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total
