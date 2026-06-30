"""knlg_rule model: Rules (encoded knowledge cards as executable logic)."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgRule(Base):
    """Rule encoding a knowledge card as executable logic.

    Combines trigger (event subscription) + conditions + conclusion.
    P0 supports CRUD only; rule trigger execution, validation backtest,
    and execution log are P3 features.

    Attributes:
        id: Primary key
        name: Rule name
        description: Optional description
        source_kc_id: Source knowledge card ID
        scope: JSON scope definition (where rule applies)
        trigger: JSON trigger config (event_subscription)
        conditions: JSON array of condition objects
        conclusion: JSON conclusion object (action/message/priority/notify)
        exceptions: JSON exception conditions
        confidence: 0-1 confidence score
        version: Rule version (semantic)
        status: draft / testing / active / paused / deprecated
        execution_stats: JSON runtime statistics (P3)
        published_at: When rule was activated
        workspace_id: Owning workspace
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_rule"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_kc_id = Column(
        Integer,
        ForeignKey("knlg_knowledge_card.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    scope = Column(JSON, nullable=False)
    trigger = Column(JSON, nullable=False)
    conditions = Column(JSON, nullable=False)
    conclusion = Column(JSON, nullable=False)
    exceptions = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=False, default=0.5, index=True)
    version = Column(String(32), nullable=False, default="1.0")
    status = Column(String(32), nullable=False, default="draft", index=True)
    execution_stats = Column(JSON, nullable=True)
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
    source_kc = relationship("KnlgKnowledgeCard", foreign_keys=[source_kc_id])

    __table_args__ = (Index("idx_r_workspace_status", "workspace_id", "status"),)

    def __repr__(self) -> str:
        return f"<KnlgRule(id={self.id}, name={self.name}, status={self.status}, workspace_id={self.workspace_id})>"
