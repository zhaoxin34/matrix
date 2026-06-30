"""knlg_interview_turn model: Individual Q&A turns within an interview."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgInterviewTurn(Base):
    """One Q&A turn in an interview.

    Represents a single question-answer pair in the interview flow, with
    support for followup chains via parent_turn_id.

    Attributes:
        id: Primary key
        interview_id: Parent interview
        sequence: Order within interview (1, 2, 3, ...)
        question: Question text or followup prompt
        answer: Expert's answer
        type: initial / followup / counter_example / clarification
        confidence: 0-1, AI's confidence in Q&A validity (P1+)
        parent_turn_id: Previous turn in followup chain (NULL for initial)
        source_case_ids: JSON array of referenced real case IDs
        tags: JSON array of tag strings
        expert_id: User ID who provided the answer
        metadata: JSON extended data (signals, counter-example marks, etc.)
        workspace_id: Owning workspace
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_interview_turn"

    id = Column(Integer, primary_key=True, autoincrement=True)
    interview_id = Column(
        Integer,
        ForeignKey("knlg_interview.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    type = Column(String(32), nullable=False, default="initial", index=True)
    confidence = Column(Float, nullable=False, default=0.5)
    parent_turn_id = Column(
        Integer,
        ForeignKey("knlg_interview_turn.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source_case_ids = Column(JSON, nullable=True)
    tags = Column(JSON, nullable=True)
    expert_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    meta_data = Column("metadata", JSON, nullable=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False, index=True)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    interview = relationship("KnlgInterview", foreign_keys=[interview_id])
    parent = relationship("KnlgInterviewTurn", remote_side=[id], foreign_keys=[parent_turn_id])
    expert = relationship("User", foreign_keys=[expert_id])

    __table_args__ = (Index("idx_turn_interview_seq", "interview_id", "sequence"),)

    def __repr__(self) -> str:
        return f"<KnlgInterviewTurn(id={self.id}, interview_id={self.interview_id}, sequence={self.sequence})>"
