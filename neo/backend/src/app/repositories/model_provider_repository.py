"""Model Provider repository for database operations."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.model_provider import ModelProvider


class ModelProviderRepository:
    """Repository for ModelProvider database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, provider: ModelProvider) -> ModelProvider:
        """Create a new Model Provider."""
        if not provider.code:
            provider.code = f"mp_{uuid.uuid4().hex[:16]}"
        self.db.add(provider)
        self.db.flush()
        self.db.refresh(provider)
        return provider

    def get_by_id(self, provider_id: int) -> ModelProvider | None:
        """Get a Model Provider by ID."""
        stmt = select(ModelProvider).where(ModelProvider.id == provider_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_code(self, code: str) -> ModelProvider | None:
        """Get a Model Provider by code."""
        stmt = select(ModelProvider).where(ModelProvider.code == code)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def list_providers(
        self,
        enabled: bool | None = None,
        for_agent: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ModelProvider], int]:
        """List Model Providers with filters and pagination.

        Args:
            enabled: Filter by enabled status
            for_agent: If True, only return providers with at least one enabled model
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (providers list, total count)
        """
        stmt = select(ModelProvider)

        if enabled is not None:
            stmt = stmt.where(ModelProvider.enabled == enabled)

        if for_agent:
            # Only providers with at least one enabled model
            # Use EXISTS subquery to avoid duplicate rows from JOIN
            from sqlalchemy import exists

            from app.models.model_config import ModelConfig

            has_enabled_model = exists().where(
                (ModelConfig.provider_id == ModelProvider.id) & (ModelConfig.enabled == True)  # noqa: E712
            )
            stmt = stmt.where(has_enabled_model)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate
        stmt = stmt.order_by(ModelProvider.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        providers = list(result.scalars().all())

        return providers, total

    def update(self, provider: ModelProvider) -> ModelProvider:
        """Update a Model Provider."""
        provider.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(provider)
        return provider

    def delete(self, provider: ModelProvider) -> None:
        """Hard delete a Model Provider (cascade deletes models)."""
        self.db.delete(provider)
        self.db.flush()

    def update_status(self, provider: ModelProvider, enabled: bool) -> ModelProvider:
        """Update the enabled status of a Model Provider."""
        provider.enabled = enabled
        provider.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(provider)
        return provider

    def check_code_exists(self, code: str, exclude_id: int | None = None) -> bool:
        """Check if a provider code already exists."""
        stmt = select(func.count()).select_from(ModelProvider).where(ModelProvider.code == code)
        if exclude_id:
            stmt = stmt.where(ModelProvider.id != exclude_id)
        count = self.db.execute(stmt).scalar_one()
        return count > 0
