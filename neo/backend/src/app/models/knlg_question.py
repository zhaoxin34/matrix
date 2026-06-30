"""knlg_question model: Interview questions."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgQuestion(Base):
    """Interview question.

    A single interview prompt that can be organized in a tree and linked
    to multiple interviews.

    Attributes:
        id: Primary key
        text: Question content
        domain: Question domain (e.g., opportunity_judgement)
        tags: JSON array of tag strings
        parent_question_id: Optional parent question (for hierarchical organization)
        tree_id: Optional reference to question tree template
        priority: Priority for interview ordering (higher = earlier)
        status: pending / in_progress / answered / archived
        workspace_id: Owning workspace
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_question"

    id = Column(Integer, primary_key=True, autoincrement=True)
    text = Column(Text, nullable=False)
    domain = Column(String(64), nullable=False, index=True)
    tags = Column(JSON, nullable=True)
    parent_question_id = Column(
        Integer,
        ForeignKey("knlg_question.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    tree_id = Column(
        Integer,
        ForeignKey("knlg_question_tree.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    priority = Column(Integer, nullable=False, default=0)
    status = Column(String(32), nullable=False, default="pending", index=True)
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
    parent = relationship("KnlgQuestion", remote_side=[id], foreign_keys=[parent_question_id])
    tree = relationship("KnlgQuestionTree", foreign_keys=[tree_id])

    __table_args__ = (Index("idx_q_workspace_status", "workspace_id", "status"),)

    def __repr__(self) -> str:
        return f"<KnlgQuestion(id={self.id}, status={self.status}, workspace_id={self.workspace_id})>"
