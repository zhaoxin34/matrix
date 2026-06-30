"""knlg_import_job model: Import job tracking."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgImportJob(Base):
    """Import job tracking.

    In P0, jobs are created in 'pending' status; actual parsing workflow
    is driven by P2 (Document Parser). API allows manual status updates
    for testing/admin purposes.

    Attributes:
        id: Primary key
        document_id: Source document ID
        status: pending / parsing / classifying / extracting / completed / failed
        progress: 0-1 progress ratio
        started_at: Processing start time (NULL until started)
        finished_at: Processing finish time (NULL until finished)
        result_summary: JSON result summary
        error_message: Error message if status=failed
        workspace_id: Owning workspace
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_import_job"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(
        Integer,
        ForeignKey("knlg_document.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(String(32), nullable=False, default="pending", index=True)
    progress = Column(Float, nullable=False, default=0.0)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    result_summary = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    document = relationship("KnlgDocument", foreign_keys=[document_id])

    def __repr__(self) -> str:
        return (
            f"<KnlgImportJob(id={self.id}, document_id={self.document_id}, "
            f"status={self.status}, workspace_id={self.workspace_id})>"
        )
