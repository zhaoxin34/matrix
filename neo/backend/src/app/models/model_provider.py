"""Model Provider model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ApiType(str, PyEnum):
    """Supported API types for model providers."""

    OPENAI_COMPLETIONS = "openai-completions"
    OPENAI_RESPONSES = "openai-responses"
    ANTHROPIC_MESSAGES = "anthropic-messages"
    GOOGLE_GENERATIVE_AI = "google-generative-ai"


class ModelProvider(Base):
    """Model Provider model.

    Represents a model provider (e.g., OpenAI, Anthropic, Ollama) with
    connection configuration.

    Attributes:
        id: Primary key
        code: URL-friendly unique identifier
        name: Display name
        description: Optional description
        api_type: API type (openai-completions, anthropic-messages, etc.)
        base_url: API endpoint URL
        api_key_env: Environment variable name for API Key
        headers: Custom request headers (JSON)
        enabled: Whether the provider is enabled
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "agent_model_provider"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(64), nullable=False)
    description = Column(String(500), nullable=True)
    api_type = Column(String(32), nullable=False)
    base_url = Column(String(512), nullable=True)
    api_key_env = Column(String(128), nullable=True)
    headers = Column(JSON, nullable=True)
    enabled = Column(Boolean, nullable=False, default=True)
    created_by = Column(BigInteger, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    models = relationship(
        "ModelConfig",
        back_populates="provider",
        cascade="all, delete-orphan",
        order_by="desc(ModelConfig.created_at)",
    )

    __table_args__ = (
        Index("idx_agent_mp_enabled", "enabled"),
        Index("idx_agent_mp_created_by", "created_by"),
    )

    def __repr__(self) -> str:
        return f"<ModelProvider(id={self.id}, code={self.code}, name={self.name})>"
