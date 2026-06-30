"""knlg_source_ref model: References from knowledge cards to source entities."""

from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgSourceRef(Base):
    """Reference from a knowledge card to its source entity.

    Unified source association table binding KnowledgeCard with the
    original source (interview / document / data pattern).

    Attributes:
        id: Primary key
        kc_id: Knowledge card ID
        source_type: expert_interview / document / data_pattern
        source_id: Source entity ID (knlg_interview_turn / knlg_document / etc.)
        source_excerpt: Optional verbatim excerpt from source
        contribution_weight: 0-1 weight of this source's contribution to confidence
        workspace_id: Owning workspace
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_source_ref"

    id = Column(Integer, primary_key=True, autoincrement=True)
    kc_id = Column(
        Integer,
        ForeignKey("knlg_knowledge_card.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_type = Column(String(32), nullable=False)
    source_id = Column(Integer, nullable=False)
    source_excerpt = Column(Text, nullable=True)
    contribution_weight = Column(Float, nullable=False, default=1.0)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    knowledge_card = relationship("KnlgKnowledgeCard", foreign_keys=[kc_id])

    __table_args__ = (Index("idx_sr_source", "source_type", "source_id"),)

    def __repr__(self) -> str:
        return (
            f"<KnlgSourceRef(id={self.id}, kc_id={self.kc_id}, "
            f"source_type={self.source_type}, source_id={self.source_id})>"
        )
