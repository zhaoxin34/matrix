"""knlg_interview_session model: Interview sessions (groups of interviews with one expert)."""

from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgInterviewSession(Base):
    """Interview session.

    Groups multiple interviews with the same expert on a topic. In P0,
    sessions are manually created; AI agent-driven sessions are P1+.

    Attributes:
        id: Primary key
        expert_id: User ID of the expert being interviewed
        topic: Session topic (e.g., "sales opportunity judgment")
        mode: ai_agent / manual (P0 only supports manual)
        started_at: Session start time
        ended_at: Session end time (NULL = ongoing)
        workspace_id: Owning workspace
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
    expert = relationship("User", foreign_keys=[expert_id])

    def __repr__(self) -> str:
        return (
            f"<KnlgInterviewSession(id={self.id}, topic={self.topic}, "
            f"expert_id={self.expert_id}, workspace_id={self.workspace_id})>"
        )
