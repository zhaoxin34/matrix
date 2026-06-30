"""knlg_knowledge_card_version model: Version history of knowledge cards."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgKnowledgeCardVersion(Base):
    """Version history snapshot of a knowledge card.

    Stores full JSON snapshots for diff and audit. In P0, versions are
    READ-ONLY via API; version diff UI is P1+.

    Attributes:
        id: Primary key
        kc_id: Knowledge card ID
        version: Version string (e.g., 1.0, 1.1, 2.0)
        snapshot: Full JSON snapshot of card at this version
        change_note: Optional human-readable change description
        changed_by: User who made the change
        workspace_id: Owning workspace
        created_at: Version creation timestamp
    """

    __tablename__ = "knlg_knowledge_card_version"

    id = Column(Integer, primary_key=True, autoincrement=True)
    kc_id = Column(
        Integer,
        ForeignKey("knlg_knowledge_card.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version = Column(String(32), nullable=False)
    snapshot = Column(JSON, nullable=False)
    change_note = Column(Text, nullable=True)
    changed_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    knowledge_card = relationship("KnlgKnowledgeCard", foreign_keys=[kc_id])
    changer = relationship("User", foreign_keys=[changed_by])

    def __repr__(self) -> str:
        return f"<KnlgKnowledgeCardVersion(id={self.id}, kc_id={self.kc_id}, version={self.version})>"
