"""Model Provider service for business logic."""

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessException, ErrorCode
from app.models.model_config import ModelConfig
from app.models.model_provider import ModelProvider
from app.repositories.model_config_repository import ModelConfigRepository
from app.repositories.model_provider_repository import ModelProviderRepository
from app.schemas.model_config import ModelConfigCreate, ModelConfigUpdate
from app.schemas.model_provider import ModelProviderCreate, ModelProviderUpdate


class ModelProviderService:
    """Service for Model Provider business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.provider_repo = ModelProviderRepository(db)
        self.config_repo = ModelConfigRepository(db)

    def create_provider(self, data: ModelProviderCreate, user_id: int) -> ModelProvider:
        """Create a new Model Provider."""
        # Check code uniqueness
        if self.provider_repo.check_code_exists(data.code):
            raise BusinessException(ErrorCode.CONFLICT, f"Provider code '{data.code}' already exists")

        provider = ModelProvider(
            code=data.code,
            name=data.name,
            description=data.description,
            api_type=data.api_type.value,
            base_url=data.base_url,
            api_key_env=data.api_key_env,
            headers=data.headers,
            enabled=True,
            created_by=user_id,
        )

        self.db.commit()
        return self.provider_repo.create(provider)

    def get_provider(self, provider_id: int) -> ModelProvider:
        """Get a Model Provider by ID."""
        provider = self.provider_repo.get_by_id(provider_id)
        if not provider:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Model Provider {provider_id} not found")
        return provider

    def list_providers(
        self,
        enabled: bool | None = None,
        for_agent: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ModelProvider], int]:
        """List Model Providers with filters."""
        return self.provider_repo.list_providers(
            enabled=enabled,
            for_agent=for_agent,
            page=page,
            page_size=page_size,
        )

    def update_provider(self, provider_id: int, data: ModelProviderUpdate) -> ModelProvider:
        """Update a Model Provider."""
        provider = self.get_provider(provider_id)

        # Check code uniqueness if changing
        if data.code and data.code != provider.code:
            if self.provider_repo.check_code_exists(data.code, exclude_id=provider_id):
                raise BusinessException(ErrorCode.CONFLICT, f"Provider code '{data.code}' already exists")

        # Update fields
        if data.name is not None:
            provider.name = data.name
        if data.description is not None:
            provider.description = data.description
        if data.api_type is not None:
            provider.api_type = data.api_type.value
        if data.base_url is not None:
            provider.base_url = data.base_url
        if data.api_key_env is not None:
            provider.api_key_env = data.api_key_env
        if data.headers is not None:
            provider.headers = data.headers

        self.db.commit()
        return self.provider_repo.update(provider)

    def delete_provider(self, provider_id: int) -> None:
        """Delete a Model Provider (cascade deletes models)."""
        provider = self.get_provider(provider_id)
        self.provider_repo.delete(provider)
        self.db.commit()

    def enable_provider(self, provider_id: int) -> ModelProvider:
        """Enable a Model Provider."""
        provider = self.get_provider(provider_id)
        self.db.commit()
        return self.provider_repo.update_status(provider, enabled=True)

    def disable_provider(self, provider_id: int) -> ModelProvider:
        """Disable a Model Provider."""
        provider = self.get_provider(provider_id)
        self.db.commit()
        return self.provider_repo.update_status(provider, enabled=False)

    # ============ Model Config Operations ============

    def create_model_config(
        self,
        provider_id: int,
        data: ModelConfigCreate,
    ) -> ModelConfig:
        """Create a new Model Config under a provider."""
        # Verify provider exists
        self.get_provider(provider_id)

        # Check model uniqueness
        if self.config_repo.check_model_exists(provider_id, data.model_id):
            raise BusinessException(
                ErrorCode.CONFLICT,
                f"Model '{data.model_id}' already exists under this provider",
            )

        config = ModelConfig(
            provider_id=provider_id,
            model_id=data.model_id,
            display_name=data.display_name or data.model_id,
            context_window=data.context_window,
            max_tokens=data.max_tokens,
            supports_thinking=data.supports_thinking,
            thinking_level_map=data.thinking_level_map,
            input_types=data.input_types,
            enabled=True,
        )

        self.db.commit()
        return self.config_repo.create(config)

    def get_model_config(self, provider_id: int, model_id: str) -> ModelConfig:
        """Get a Model Config by provider_id and model_id."""
        config = self.config_repo.get_by_provider_and_model(provider_id, model_id)
        if not config:
            raise BusinessException(
                ErrorCode.NOT_FOUND,
                f"Model '{model_id}' not found under provider {provider_id}",
            )
        return config

    def list_models(
        self,
        provider_id: int,
        enabled: bool | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[ModelConfig], int]:
        """List Model Configs by provider."""
        # Verify provider exists
        self.get_provider(provider_id)

        return self.config_repo.list_by_provider(
            provider_id=provider_id,
            enabled=enabled,
            page=page,
            page_size=page_size,
        )

    def update_model_config(
        self,
        provider_id: int,
        model_id: str,
        data: ModelConfigUpdate,
    ) -> ModelConfig:
        """Update a Model Config."""
        config = self.get_model_config(provider_id, model_id)

        # Update fields
        if data.display_name is not None:
            config.display_name = data.display_name
        if data.context_window is not None:
            config.context_window = data.context_window
        if data.max_tokens is not None:
            config.max_tokens = data.max_tokens
        if data.supports_thinking is not None:
            config.supports_thinking = data.supports_thinking
        if data.thinking_level_map is not None:
            config.thinking_level_map = data.thinking_level_map
        if data.input_types is not None:
            config.input_types = data.input_types

        self.db.commit()
        return self.config_repo.update(config)

    def delete_model_config(self, provider_id: int, model_id: str) -> None:
        """Delete a Model Config."""
        config = self.get_model_config(provider_id, model_id)
        self.config_repo.delete(config)
        self.db.commit()
