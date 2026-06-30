"""knlg_candidate_kc model: Candidate knowledge cards (P2 owns this)."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgCandidateKc(Base):
    """Candidate knowledge card generated from imported documents.

    In P0, this table is created but CRUD is READ-ONLY via API. Candidate
    generation/approval flow belongs to P2 (Document Parser).

    Attributes:
        id: Primary key
        job_id: Source import job
        chunk_id: Source parsed chunk (nullable)
        title: Candidate title
        statement: Candidate statement
        key_signals: JSON extracted signals
        candidate_confidence: AI confidence 0-1
        confidence_breakdown: JSON multi-dimensional breakdown
        validation_status: pending / validating / validated / rejected / auto_published / abandoned
        validation_sources: JSON array of validation sources
        triggered_interview_id: Optional interview triggered to validate this candidate
        promoted_kc_id: KC ID if this candidate was promoted to a knowledge card
        reviewer_id: User who reviewed this candidate
        reviewed_at: Review timestamp
        review_note: Reviewer notes
        workspace_id: Owning workspace
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_candidate_kc"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(
        Integer,
        ForeignKey("knlg_import_job.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_id = Column(
        Integer,
        ForeignKey("knlg_parsed_chunk.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title = Column(String(255), nullable=False)
    statement = Column(Text, nullable=False)
    key_signals = Column(JSON, nullable=True)
    candidate_confidence = Column(Float, nullable=False, default=0.5, index=True)
    confidence_breakdown = Column(JSON, nullable=True)
    validation_status = Column(String(32), nullable=False, default="pending", index=True)
    validation_sources = Column(JSON, nullable=True)
    triggered_interview_id = Column(
        Integer,
        ForeignKey("knlg_interview.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    promoted_kc_id = Column(
        Integer,
        ForeignKey("knlg_knowledge_card.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reviewer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewed_at = Column(DateTime, nullable=True)
    review_note = Column(Text, nullable=True)
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
    job = relationship("KnlgImportJob", foreign_keys=[job_id])
    chunk = relationship("KnlgParsedChunk", foreign_keys=[chunk_id])
    triggered_interview = relationship("KnlgInterview", foreign_keys=[triggered_interview_id])
    promoted_kc = relationship("KnlgKnowledgeCard", foreign_keys=[promoted_kc_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])

    def __repr__(self) -> str:
        return f"<KnlgCandidateKc(id={self.id}, title={self.title[:30]}, validation_status={self.validation_status})>"
