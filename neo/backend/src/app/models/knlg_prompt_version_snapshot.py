"""knlg_prompt_version_snapshot model: Audit trail for prompt rendering (Phase 3)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, Integer, String, Text

from app.database import Base


class KnlgPromptVersionSnapshot(Base):
    """Snapshot of a rendered Prompt at the time of an LLM call.

    Enables "why did AI ask this question" audit trail.

    Attributes:
        id: Primary key
        prompt_id: Source prompt (FK to knlg_llm_prompt)
        prompt_version: Version string of the prompt used
        rendered_text: Fully rendered text sent to LLM
        variables_json: Variables used (desensitized)
        used_at: When the prompt was used
        workspace_id: Owning workspace
    """

    __tablename__ = "knlg_prompt_version_snapshot"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_id = Column(Integer, ForeignKey("knlg_llm_prompt.id"), nullable=False)
    prompt_version = Column(String(32), nullable=False)
    rendered_text = Column(Text, nullable=False)
    variables_json = Column(JSON, nullable=False)
    used_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    __table_args__ = (Index("idx_snapshot_prompt", "prompt_id", "prompt_version"),)

    def __repr__(self) -> str:
        return f"<KnlgPromptVersionSnapshot id={self.id} prompt={self.prompt_id} v={self.prompt_version}>"
