"""Model Config repository for database operations."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.model_config import ModelConfig


class ModelConfigRepository:
    """Repository for ModelConfig database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, config: ModelConfig) -> ModelConfig:
        """Create a new Model Config."""
        self.db.add(config)
        self.db.flush()
        self.db.refresh(config)
        return config

    def get_by_id(self, config_id: int) -> ModelConfig | None:
        """Get a Model Config by ID."""
        stmt = select(ModelConfig).where(ModelConfig.id == config_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_provider_and_model(
        self,
        provider_id: int,
        model_id: str,
    ) -> ModelConfig | None:
        """Get a Model Config by provider_id and model_id."""
        stmt = select(ModelConfig).where(
            ModelConfig.provider_id == provider_id,
            ModelConfig.model_id == model_id,
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def list_by_provider(
        self,
        provider_id: int,
        enabled: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ModelConfig], int]:
        """List Model Configs by provider with filters and pagination."""
        stmt = select(ModelConfig).where(ModelConfig.provider_id == provider_id)

        if enabled is not None:
            stmt = stmt.where(ModelConfig.enabled == enabled)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate
        stmt = stmt.order_by(ModelConfig.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        configs = list(result.scalars().all())

        return configs, total

    def list_all_enabled(
        self,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ModelConfig], int]:
        """List all enabled Model Configs."""
        return self.list_by_provider(provider_id=0, enabled=True, page=page, page_size=page_size)

    def update(self, config: ModelConfig) -> ModelConfig:
        """Update a Model Config."""
        config.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(config)
        return config

    def delete(self, config: ModelConfig) -> None:
        """Delete a Model Config."""
        self.db.delete(config)
        self.db.flush()

    def check_model_exists(
        self,
        provider_id: int,
        model_id: str,
        exclude_id: int | None = None,
    ) -> bool:
        """Check if a model already exists under the provider."""
        stmt = (
            select(func.count())
            .select_from(ModelConfig)
            .where(
                ModelConfig.provider_id == provider_id,
                ModelConfig.model_id == model_id,
            )
        )
        if exclude_id:
            stmt = stmt.where(ModelConfig.id != exclude_id)
        count = self.db.execute(stmt).scalar_one()
        return count > 0

    def get_enabled_model(self, provider_id: int, model_id: str) -> ModelConfig | None:
        """Get an enabled Model Config by provider_id and model_id."""
        stmt = select(ModelConfig).where(
            ModelConfig.provider_id == provider_id,
            ModelConfig.model_id == model_id,
            ModelConfig.enabled == True,  # noqa: E712
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()
