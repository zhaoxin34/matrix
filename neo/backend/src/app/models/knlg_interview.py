"""knlg_interview model: Individual interviews (Q&A flow)."""

from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgInterview(Base):
    """Individual interview.

    A single Q&A interaction flow with a specific expert, starting from
    a specific question. P0 supports manual interviews; AI-driven interviews
    (with auto-generated summary) are P1+.

    Attributes:
        id: Primary key
        session_id: Parent interview session
        question_id: Starting question (knlg_question.id)
        expert_id: User ID of the expert
        mode: ai_agent / manual
        summary: Optional AI-generated summary (P1+)
        started_at: Interview start time
        ended_at: Interview end time (NULL = ongoing)
        workspace_id: Owning workspace
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_interview"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        Integer,
        ForeignKey("knlg_interview_session.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id = Column(
        Integer,
        ForeignKey("knlg_question.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    expert_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    mode = Column(String(32), nullable=False)
    summary = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    session = relationship("KnlgInterviewSession", foreign_keys=[session_id])
    question = relationship("KnlgQuestion", foreign_keys=[question_id])
    expert = relationship("User", foreign_keys=[expert_id])

    __table_args__ = (Index("idx_iv_session_question", "session_id", "question_id"),)

    def __repr__(self) -> str:
        return (
            f"<KnlgInterview(id={self.id}, session_id={self.session_id}, "
            f"question_id={self.question_id}, workspace_id={self.workspace_id})>"
        )
