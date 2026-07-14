"""Model Config model definition."""

from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ModelConfig(Base):
    """Model Config model.

    Represents a model configuration under a specific provider.

    Attributes:
        id: Primary key
        provider_id: Foreign key to ModelProvider
        model_id: Model identifier (e.g., "gpt-4", "claude-3-5-sonnet")
        display_name: Human-readable name
        context_window: Maximum context size in tokens
        max_tokens: Maximum output tokens
        supports_thinking: Whether the model supports thinking/reasoning
        thinking_level_map: Mapping of thinking levels (JSON)
        input_types: Supported input types (text, image)
        enabled: Whether the model is enabled
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "agent_model_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider_id = Column(
        BigInteger,
        ForeignKey("agent_model_provider.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_id = Column(String(64), nullable=False)
    display_name = Column(String(128), nullable=True)
    context_window = Column(Integer, nullable=False, default=128000)
    max_tokens = Column(Integer, nullable=False, default=4096)
    supports_thinking = Column(Boolean, nullable=False, default=False)
    thinking_level_map = Column(JSON, nullable=True)
    input_types = Column(JSON, nullable=False, default='["text"]')
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    provider = relationship(
        "ModelProvider",
        back_populates="models",
    )

    def __repr__(self) -> str:
        return f"<ModelConfig(id={self.id}, provider_id={self.provider_id}, model_id={self.model_id})>"
