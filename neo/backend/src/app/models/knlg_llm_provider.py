"""knlg_llm_provider model: LLM provider configuration."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgLlmProvider(Base):
    """LLM provider configuration.

    Global (not workspace-scoped). Stores API base URL and key reference
    for each LLM provider (OpenAI, Anthropic, Qwen, etc.).

    Attributes:
        id: Primary key
        name: Provider name (openai, anthropic, qwen, ...) - unique
        display_name: Human-readable display name
        api_base_url: Optional custom API base URL
        api_key_secret: Reference to secret in secret manager
        enabled: Whether this provider is enabled
        config: JSON provider-level config
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "knlg_llm_provider"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False)
    display_name = Column(String(128), nullable=False)
    api_base_url = Column(String(512), nullable=True)
    api_key_secret = Column(String(128), nullable=False)
    enabled = Column(Boolean, nullable=False, default=True)
    config = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    models = relationship("KnlgLlmModel", back_populates="provider", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("name", name="uk_llm_provider_name"),)

    def __repr__(self) -> str:
        return f"<KnlgLlmProvider(id={self.id}, name={self.name}, enabled={self.enabled})>"
