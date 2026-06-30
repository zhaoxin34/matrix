"""knlg_llm_prompt model: LLM prompt template management."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgLlmPrompt(Base):
    """LLM prompt template.

    Categorized by use case (interview / extract / classify / ...).
    Versioned for A/B testing and rollback. Can be global (workspace_id NULL)
    or workspace-specific override.

    Attributes:
        id: Primary key
        name: Template name (unique within version)
        category: interview / extract / extract_signal / classify / ...
        version: Template version string
        template: Prompt template body (with {variable} placeholders)
        variables: JSON array of variable definitions
        model_id: Associated LLM model
        parameters: JSON model parameters (temperature, top_p, ...)
        is_active: Whether this version is active
        workspace_id: Owning workspace (NULL = global)
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_llm_prompt"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False, index=True)
    version = Column(String(32), nullable=False)
    template = Column(Text, nullable=False)
    variables = Column(JSON, nullable=False)
    model_id = Column(
        Integer,
        ForeignKey("knlg_llm_model.id", ondelete="RESTRICT"),
        nullable=False,
    )
    parameters = Column(JSON, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="RESTRICT"),
        nullable=True,
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

    model = relationship("KnlgLlmModel", foreign_keys=[model_id])
    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    creator = relationship("User", foreign_keys=[created_by])

    __table_args__ = (UniqueConstraint("name", "version", name="idx_prompt_name_version"),)

    def __repr__(self) -> str:
        return f"<KnlgLlmPrompt(id={self.id}, name={self.name}, version={self.version}, is_active={self.is_active})>"
