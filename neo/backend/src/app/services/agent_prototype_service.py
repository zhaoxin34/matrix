"""Agent Prototype service for business logic."""

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessException, ErrorCode
from app.models.agent_prototype import AgentPrototype, AgentStatus, AgentType
from app.models.agent_prototype_version import AgentPrototypeVersion
from app.repositories.agent_prototype_repository import (
    AgentPrototypeRepository,
    AgentPrototypeVersionRepository,
)
from app.schemas.agent_prototype import (
    AgentPrototypeCreate,
    AgentPrototypePublish,
    AgentPrototypeRollback,
    AgentPrototypeStatusUpdate,
    AgentPrototypeUpdate,
)

# Valid error codes for this service
INVALID_STATE = ErrorCode.INVALID_OPERATION
VALIDATION_ERROR = ErrorCode.BAD_REQUEST


class AgentPrototypeService:
    """Service for Agent Prototype business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.prototype_repo = AgentPrototypeRepository(db)
        self.version_repo = AgentPrototypeVersionRepository(db)

    def create_prototype(self, data: AgentPrototypeCreate, user_id: int) -> AgentPrototype:
        """Create a new Agent Prototype."""
        # Validate provider and model if provided (new fields)
        if data.provider_id is not None or data.model_id is not None:
            self._validate_provider_and_model(data.provider_id, data.model_id)

        # Create prototype with draft status
        prototype = AgentPrototype(
            name=data.name,
            description=data.description,
            model=data.model,
            prompts=data.prompts or {},
            config=data.config or {},
            status=AgentStatus.DRAFT,
            created_by=user_id,
            # New fields for Model Provider
            provider_id=data.provider_id,
            model_id=data.model_id,
            llm_config=data.llm_config,
            # Agent type
            type=AgentType(data.type.value) if data.type else AgentType.SITE_OPERATION,
        )
        self.db.commit()
        return self.prototype_repo.create(prototype)

    def get_prototype(self, prototype_id: int) -> AgentPrototype:
        """Get an Agent Prototype by ID."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Agent Prototype {prototype_id} not found")
        return prototype

    def list_prototypes(
        self,
        status: AgentStatus | None = None,
        agent_type: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[AgentPrototype], int]:
        """List Agent Prototypes with filters."""
        return self.prototype_repo.list_prototypes(status=status, agent_type=agent_type, search=search, page=page, page_size=page_size)

    def update_prototype(self, prototype_id: int, data: AgentPrototypeUpdate) -> AgentPrototype:
        """Update an Agent Prototype.

        If the prototype is in enabled status, editing will revert it to draft status.
        Disabled prototypes cannot be edited.
        """
        prototype = self.get_prototype(prototype_id)

        # Disabled prototypes cannot be edited
        if prototype.status == AgentStatus.DISABLED:
            raise BusinessException(INVALID_STATE, "Disabled prototypes cannot be edited")

        # If enabled, revert to draft first (editing creates a new draft)
        if prototype.status == AgentStatus.ENABLED:
            prototype.status = AgentStatus.DRAFT

        # Update fields if provided
        if data.name is not None:
            prototype.name = data.name
        if data.description is not None:
            prototype.description = data.description
        if data.model is not None:
            prototype.model = data.model
        if data.prompts is not None:
            prototype.prompts = data.prompts
        if data.config is not None:
            prototype.config = data.config

        # New fields for Model Provider
        if data.provider_id is not None or data.model_id is not None:
            self._validate_provider_and_model(data.provider_id, data.model_id)
        if data.provider_id is not None:
            prototype.provider_id = data.provider_id
        if data.model_id is not None:
            prototype.model_id = data.model_id
        if data.llm_config is not None:
            prototype.llm_config = data.llm_config

        self.db.commit()
        return self.prototype_repo.update(prototype)

    def delete_prototype(self, prototype_id: int) -> None:
        """Delete an Agent Prototype (only draft status)."""
        prototype = self.get_prototype(prototype_id)

        # Only draft status can be deleted
        if prototype.status != AgentStatus.DRAFT:
            raise BusinessException(INVALID_STATE, "Only draft prototypes can be deleted")

        self.prototype_repo.delete(prototype)
        self.db.commit()

    def update_status(self, prototype_id: int, data: AgentPrototypeStatusUpdate) -> AgentPrototype:
        """Update Agent Prototype status (enable/disable)."""
        prototype = self.get_prototype(prototype_id)

        # Validate status transition
        if data.status == AgentStatus.ENABLED:
            # Can only enable if has version (published at least once)
            if not prototype.version:
                raise BusinessException(INVALID_STATE, "Prototype must be published before enabling")
        elif data.status == AgentStatus.DISABLED:
            # Can only disable if currently enabled
            if prototype.status != AgentStatus.ENABLED:
                raise BusinessException(INVALID_STATE, "Only enabled prototypes can be disabled")

        self.db.commit()
        return self.prototype_repo.update_status(prototype, data.status)

    def publish_prototype(self, prototype_id: int, data: AgentPrototypePublish, user_id: int) -> AgentPrototype:
        """Publish a new version of the Agent Prototype."""
        prototype = self.get_prototype(prototype_id)

        # Validate prompts not empty
        if not prototype.prompts or (isinstance(prototype.prompts, dict) and len(prototype.prompts) == 0):
            raise BusinessException(VALIDATION_ERROR, "Prompts cannot be empty")

        # Calculate next version
        new_version = self.prototype_repo.calculate_next_version(prototype_id)

        # Publish
        self.db.commit()
        return self.prototype_repo.publish(
            prototype=prototype,
            new_version=new_version,
            created_by=user_id,
            change_summary=data.change_summary,
            is_rollback=False,
        )

    def get_next_version(self, prototype_id: int) -> str:
        """Get the next version number for a prototype."""
        self.get_prototype(prototype_id)
        return self.prototype_repo.calculate_next_version(prototype_id)

    def get_version_history(self, prototype_id: int) -> list[AgentPrototypeVersion]:
        """Get version history for a prototype."""
        # Verify prototype exists
        self.get_prototype(prototype_id)
        return self.version_repo.get_versions_by_prototype(prototype_id)

    def rollback_prototype(self, prototype_id: int, data: AgentPrototypeRollback, user_id: int) -> AgentPrototype:
        """Rollback Agent Prototype to a specific version."""
        prototype = self.get_prototype(prototype_id)

        # Get target version
        target_version = self.version_repo.get_version_by_id(data.version_id)
        if not target_version:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Version {data.version_id} not found")

        # Verify version belongs to this prototype
        if target_version.agent_prototype_id != prototype_id:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Version {data.version_id} not found for this prototype")

        # Cannot rollback to current version
        if target_version.version == prototype.version:
            raise BusinessException(VALIDATION_ERROR, "Cannot rollback to current version")

        # Perform rollback
        self.db.commit()
        return self.prototype_repo.rollback_to_version(
            prototype=prototype,
            target_version=target_version,
            created_by=user_id,
        )

    def _validate_provider_and_model(self, provider_id: int | None, model_id: str | None) -> None:
        """Validate that provider and model exist and are enabled.

        Args:
            provider_id: Provider ID to validate
            model_id: Model ID to validate

        Raises:
            BusinessException: If validation fails
        """
        from app.models.model_config import ModelConfig
        from app.models.model_provider import ModelProvider

        # If neither is provided, skip validation
        if provider_id is None and model_id is None:
            return

        # If model is provided, provider must also be provided
        if model_id is not None and provider_id is None:
            raise BusinessException(
                VALIDATION_ERROR,
                "provider_id is required when model_id is specified",
            )

        # Validate provider exists and is enabled
        provider = (
            self.db.query(ModelProvider)
            .filter(
                ModelProvider.id == provider_id,
            )
            .first()
        )
        if not provider:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Provider {provider_id} not found")
        if not provider.enabled:
            raise BusinessException(
                VALIDATION_ERROR,
                f"Provider {provider_id} is disabled",
            )

        # Validate model exists under provider and is enabled
        if model_id:
            model = (
                self.db.query(ModelConfig)
                .filter(
                    ModelConfig.provider_id == provider_id,
                    ModelConfig.model_id == model_id,
                )
                .first()
            )
            if not model:
                raise BusinessException(
                    ErrorCode.NOT_FOUND,
                    f"Model '{model_id}' not found under provider {provider_id}",
                )
            if not model.enabled:
                raise BusinessException(
                    VALIDATION_ERROR,
                    f"Model '{model_id}' is disabled",
                )
