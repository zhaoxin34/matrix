"""knlg_llm_model model: LLM model configuration."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgLlmModel(Base):
    """LLM model configuration.

    Belongs to a provider. Stores token limits, costs, and capabilities.

    Attributes:
        id: Primary key
        provider_id: Parent LLM provider ID
        name: Model name (gpt-4, claude-3.5-sonnet, ...)
        display_name: Human-readable display name
        max_tokens: Maximum token output
        cost_per_1k_input: Cost per 1K input tokens (USD)
        cost_per_1k_output: Cost per 1K output tokens (USD)
        capabilities: JSON array of capability tags (chat, embedding, function_call)
        enabled: Whether this model is enabled
        created_at: Creation timestamp
    """

    __tablename__ = "knlg_llm_model"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider_id = Column(
        Integer,
        ForeignKey("knlg_llm_provider.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(128), nullable=False)
    display_name = Column(String(128), nullable=False)
    max_tokens = Column(Integer, nullable=False)
    cost_per_1k_input = Column(Numeric(10, 6), nullable=True)
    cost_per_1k_output = Column(Numeric(10, 6), nullable=True)
    capabilities = Column(JSON, nullable=True)
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    provider = relationship("KnlgLlmProvider", back_populates="models")

    def __repr__(self) -> str:
        return f"<KnlgLlmModel(id={self.id}, name={self.name}, provider_id={self.provider_id})>"
