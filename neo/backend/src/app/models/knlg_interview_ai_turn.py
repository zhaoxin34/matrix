"""knlg_interview_ai_turn model: AI interview turns (Phase 3)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)

from app.database import Base


class KnlgInterviewAiTurn(Base):
    """AI interview turn (Phase 3).

    Each turn represents a single Q&A cycle: AI question + expert answer +
    AI response + optional signals.

    Attributes:
        id: Primary key
        session_id: Owning session (FK to knlg_interview_session)
        turn_index: Sequence number (1-based, unique per session)
        user_question_text: AI's question text
        user_question_id: Optional FK to knlg_question (from tree)
        expert_answer_text: Expert's answer (NULL during streaming)
        ai_response_text: Full AI response (after streaming completes)
        ai_response_streaming: Whether still receiving chunks
        next_question_reason: Reason for the next question (10 enum codes)
        followup_turn_id: FK to parent turn if this is a followup
        llm_request_log: JSON with full request metadata
        prompt_id / prompt_version: Prompt used (audit trail)
        model_id: Model used
        tokens_used / cost_usd / duration_ms / ttft_ms: Metrics
        started_at / completed_at: Timing
        workspace_id: Owning workspace
    """

    __tablename__ = "knlg_interview_ai_turn"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("knlg_interview_session.id", ondelete="CASCADE"), nullable=False)
    turn_index = Column(Integer, nullable=False)
    user_question_text = Column(Text, nullable=False)
    user_question_id = Column(Integer, ForeignKey("knlg_question.id"), nullable=True)
    expert_answer_text = Column(Text, nullable=True)
    ai_response_text = Column(Text, nullable=True)
    ai_response_streaming = Column(Boolean, nullable=False, default=True)
    next_question_reason = Column(String(64), nullable=True)
    followup_turn_id = Column(Integer, ForeignKey("knlg_interview_ai_turn.id"), nullable=True)
    llm_request_log = Column(JSON, nullable=True)
    prompt_id = Column(Integer, ForeignKey("knlg_llm_prompt.id"), nullable=True)
    prompt_version = Column(String(32), nullable=True)
    model_id = Column(Integer, ForeignKey("knlg_llm_model.id"), nullable=True)
    tokens_used = Column(Integer, nullable=False, default=0)
    cost_usd = Column(Numeric(10, 6), nullable=False, default=0)
    duration_ms = Column(Integer, nullable=False, default=0)
    ttft_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    __table_args__ = (
        Index("uk_session_turn", "session_id", "turn_index", unique=True),
        Index("idx_ai_turn_streaming", "ai_response_streaming"),
        Index("idx_ai_turn_workspace", "workspace_id"),
        Index("idx_ai_turn_completed", "completed_at"),
    )

    def __repr__(self) -> str:
        return f"<KnlgInterviewAiTurn id={self.id} session={self.session_id} turn={self.turn_index}>"
