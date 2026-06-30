"""knlg_knowledge_card model: Knowledge cards (the primary knowledge unit)."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgKnowledgeCard(Base):
    """Knowledge card.

    Structured knowledge extracted from interviews/documents/data.
    The primary unit consumed by agents via Rule layer.

    Attributes:
        id: Primary key
        title: Card title
        statement: Core statement (the knowledge itself)
        domain: Knowledge domain (e.g., opportunity, customer)
        tags: JSON array of tag strings
        type: judgement / risk / opportunity / process / communication / competitive
        key_signals: JSON array of key signals (for triggering)
        conditions: When this knowledge applies (natural language)
        exceptions: Exceptions and edge cases
        confidence: 0-1 confidence score
        confidence_breakdown: JSON multi-dimensional breakdown
        validation_status: pending_validation / partially_validated / validated / auto_published
        source_turn_ids: JSON array of source interview turn IDs
        source_doc_ids: JSON array of source document IDs
        source_pattern_ids: JSON array of source data pattern IDs
        expert_ids: JSON array of contributing expert IDs
        status: draft / reviewing / published / deprecated
        version: Card version (semantic)
        published_at: When card was published (NULL = not published)
        workspace_id: Owning workspace
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_knowledge_card"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    statement = Column(Text, nullable=False)
    domain = Column(String(64), nullable=False, index=True)
    tags = Column(JSON, nullable=True)
    type = Column(String(32), nullable=False, index=True)
    key_signals = Column(JSON, nullable=True)
    conditions = Column(Text, nullable=True)
    exceptions = Column(Text, nullable=True)
    confidence = Column(Float, nullable=False, default=0.5, index=True)
    confidence_breakdown = Column(JSON, nullable=True)
    validation_status = Column(String(32), nullable=False, default="pending_validation", index=True)
    source_turn_ids = Column(JSON, nullable=True)
    source_doc_ids = Column(JSON, nullable=True)
    source_pattern_ids = Column(JSON, nullable=True)
    expert_ids = Column(JSON, nullable=True)
    status = Column(String(32), nullable=False, default="draft", index=True)
    version = Column(String(32), nullable=False, default="1.0")
    published_at = Column(DateTime, nullable=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index("idx_kc_workspace_status", "workspace_id", "status"),
        Index("idx_kc_workspace_type", "workspace_id", "type"),
    )

    def __repr__(self) -> str:
        return (
            f"<KnlgKnowledgeCard(id={self.id}, title={self.title[:30]}, "
            f"status={self.status}, workspace_id={self.workspace_id})>"
        )
