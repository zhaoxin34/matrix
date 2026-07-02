"""knlg_interview_session model: Interview sessions (Phase 1 + Phase 3 AI extension)."""

from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text

from app.database import Base


class KnlgInterviewSession(Base):
    """Interview session.

    Groups multiple interviews with the same expert on a topic.
    Phase 1: manual only.
    Phase 3: AI agent mode (mode='ai_agent') with extended schema.

    Attributes:
        id: Primary key
        expert_id: User ID of the expert being interviewed
        topic: Session topic
        mode: ai_agent / manual
        status: draft / ai_probing / waiting_for_context / ai_summarizing /
                completed / paused / abandoned (Phase 3)
        tree_id: Question tree used for AI mode (Phase 3)
        waiting_reason: Reason for waiting_for_context state (Phase 3)
        current_turn_index: Current AI turn index (Phase 3)
        max_turns: Maximum turns (default 8, Phase 3)
        last_event_id: SSE Last-Event-ID for resume (Phase 3)
        started_at: Session start time
        ended_at: Session end time
        summary: AI-generated summary (Phase 3)
        workspace_id: Owning workspace
        created_by: Creator user ID
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_interview_session"

    id = Column(Integer, primary_key=True, autoincrement=True)
    expert_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    topic = Column(String(255), nullable=False)
    mode = Column(String(32), nullable=False, comment="ai_agent / manual")
    status = Column(
        String(32),
        nullable=False,
        default="open",
        comment="open / closed (manual) | draft / ai_probing / waiting_for_context / "
        "ai_summarizing / completed / paused / abandoned (ai_agent)",
    )
    # Phase 3 AI fields
    tree_id = Column(Integer, ForeignKey("knlg_question_tree.id", ondelete="SET NULL"), nullable=True)
    waiting_reason = Column(String(255), nullable=True)
    current_turn_index = Column(Integer, nullable=False, default=0)
    max_turns = Column(Integer, nullable=False, default=8)
    last_event_id = Column(String(64), nullable=True)
    summary = Column(Text, nullable=True)
    # Common
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC), nullable=False)

    __table_args__ = (
        Index("idx_session_mode_status", "mode", "status"),
        Index("idx_session_tree", "tree_id"),
    )

    def __repr__(self) -> str:
        return f"<KnlgInterviewSession id={self.id} mode={self.mode} status={self.status}>"
