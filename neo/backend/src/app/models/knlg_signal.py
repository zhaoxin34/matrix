"""knlg_signal model: Extracted signals from AI interviews (Phase 3)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text

from app.database import Base


class KnlgSignal(Base):
    """A single signal extracted from an expert answer.

    Signal types (5): pain_point / opportunity / counter_example / boundary / key_metric

    Attributes:
        id: Primary key
        session_id: Owning session
        source_turn_id: The turn that produced this signal
        type: One of 5 signal types
        confidence: 0-1 confidence score
        text: Signal description (extracted text or summary)
        linked_question_id: Optional FK to the question that triggered this signal
        metadata: JSON for extensible attributes
        workspace_id: Owning workspace
    """

    __tablename__ = "knlg_signal"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("knlg_interview_session.id", ondelete="CASCADE"), nullable=False)
    source_turn_id = Column(Integer, ForeignKey("knlg_interview_ai_turn.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(32), nullable=False)
    confidence = Column(Float, nullable=False)
    text = Column(Text, nullable=False)
    linked_question_id = Column(Integer, ForeignKey("knlg_question.id"), nullable=True)
    meta_data = Column("metadata", JSON, nullable=True)  # avoid SQLAlchemy metadata clash
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    __table_args__ = (
        Index("idx_signal_session", "session_id"),
        Index("idx_signal_type", "type"),
        Index("idx_signal_confidence", "confidence"),
        Index("idx_signal_workspace", "workspace_id"),
    )

    def __repr__(self) -> str:
        return f"<KnlgSignal id={self.id} type={self.type} confidence={self.confidence}>"
