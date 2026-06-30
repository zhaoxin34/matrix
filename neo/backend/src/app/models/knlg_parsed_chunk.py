"""knlg_parsed_chunk model: Parsed document chunks (READ-ONLY in P0)."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgParsedChunk(Base):
    """Parsed chunk of a document.

    Created by P2 (Document Parser). P0 only READS these via API.

    Attributes:
        id: Primary key
        job_id: Parent import job
        content: Chunk text content
        category: decision_experience / general_knowledge / mixed
        key_signals: JSON extracted signals
        confidence_hint: AI confidence hint 0-1
        chunk_order: Order within document (0-based)
        workspace_id: Owning workspace
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_parsed_chunk"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(
        Integer,
        ForeignKey("knlg_import_job.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    category = Column(String(32), nullable=False)
    key_signals = Column(JSON, nullable=True)
    confidence_hint = Column(Float, nullable=False, default=0.5)
    chunk_order = Column(Integer, nullable=False)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    job = relationship("KnlgImportJob", foreign_keys=[job_id])

    __table_args__ = (Index("idx_pc_job_order", "job_id", "chunk_order"),)

    def __repr__(self) -> str:
        return f"<KnlgParsedChunk(id={self.id}, job_id={self.job_id}, chunk_order={self.chunk_order})>"
