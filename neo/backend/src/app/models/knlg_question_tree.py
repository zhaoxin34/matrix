"""knlg_question_tree model: Interview question tree templates."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgQuestionTree(Base):
    """Interview question tree template.

    A reusable template that organizes interview questions in a hierarchical
    structure with followups for AI-driven expert interviews.

    Attributes:
        id: Primary key
        name: Template name
        domain: Applicable domain (e.g., opportunity, customer_communication)
        description: Optional description
        questions: JSON array of question objects with id/text/followups
        version: Template version (semantic-like, e.g., 1.0, 1.1, 2.0)
        is_active: Whether this template version is active
        workspace_id: Owning workspace (multi-tenant isolation)
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_question_tree"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(64), nullable=False, index=True)
    description = Column(Text, nullable=True)
    questions = Column(JSON, nullable=False)
    version = Column(String(32), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
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

    __table_args__ = (Index("idx_qt_workspace_active", "workspace_id", "is_active"),)

    def __repr__(self) -> str:
        return (
            f"<KnlgQuestionTree(id={self.id}, name={self.name}, "
            f"version={self.version}, workspace_id={self.workspace_id})>"
        )
