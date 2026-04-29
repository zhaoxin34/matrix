"""Agent Prototype service."""

import math
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.agent_prototype import AgentPrototype, AgentPrototypeStatus
from app.models.agent_prototype_version import AgentPrototypeVersion
from app.repositories.agent_prototype_repo import (
    AgentPrototypeRepository,
    AgentPrototypeVersionRepository,
)
from app.schemas.agent_prototype import (
    AgentPrototypeListResponse,
    AgentPrototypeResponse,
    CreateAgentPrototype,
    PaginatedAgentPrototypeResponse,
    PublishRequest,
    RollbackRequest,
    UpdateAgentPrototype,
)


class AgentPrototypeService:
    """Service for agent prototype business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = AgentPrototypeRepository(db)
        self.version_repo = AgentPrototypeVersionRepository(db)

    def create_prototype(
        self, data: CreateAgentPrototype, user_id: int
    ) -> AgentPrototype:
        """Create a new agent prototype."""
        prototype = AgentPrototype(
            name=data.name,
            description=data.description,
            model=data.model,
            temperature=data.temperature,
            max_tokens=data.max_tokens,
            prompts=data.prompts.model_dump() if data.prompts else {},
            status=AgentPrototypeStatus.draft,
            created_by=user_id,
            updated_by=user_id,
        )
        return self.repo.create(prototype)

    def get_prototype(self, prototype_id: int) -> AgentPrototype | None:
        """Get prototype by ID."""
        return self.repo.get_by_id(prototype_id)

    def list_prototypes(
        self,
        page: int = 1,
        page_size: int = 20,
        status: AgentPrototypeStatus | None = None,
        keyword: str | None = None,
    ) -> PaginatedAgentPrototypeResponse:
        """List prototypes with pagination."""
        items, total = self.repo.list(
            page=page, page_size=page_size, status=status, keyword=keyword
        )

        total_pages = math.ceil(total / page_size) if total > 0 else 1

        return PaginatedAgentPrototypeResponse(
            items=[AgentPrototypeResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def list_prototypes_simple(
        self,
        page: int = 1,
        page_size: int = 20,
        status: AgentPrototypeStatus | None = None,
        keyword: str | None = None,
    ) -> tuple[list[AgentPrototypeListResponse], int]:
        """List prototypes with simple format (for list view)."""
        items, total = self.repo.list(
            page=page, page_size=page_size, status=status, keyword=keyword
        )
        return (
            [AgentPrototypeListResponse.model_validate(item) for item in items],
            total,
        )

    def update_prototype(
        self, prototype_id: int, data: UpdateAgentPrototype, user_id: int
    ) -> AgentPrototype | None:
        """Update an agent prototype."""
        prototype = self.repo.get_by_id(prototype_id)
        if not prototype:
            return None

        if data.name is not None:
            prototype.name = data.name
        if data.description is not None:
            prototype.description = data.description
        if data.model is not None:
            prototype.model = data.model
        if data.temperature is not None:
            prototype.temperature = data.temperature
        if data.max_tokens is not None:
            prototype.max_tokens = data.max_tokens
        if data.prompts is not None:
            prototype.prompts = data.prompts.model_dump()

        prototype.updated_by = user_id
        prototype.updated_at = datetime.utcnow()

        return self.repo.update(prototype)

    def delete_prototype(self, prototype_id: int) -> bool:
        """Delete an agent prototype. Only allowed for draft status."""
        prototype = self.repo.get_by_id(prototype_id)
        if not prototype:
            return False

        if prototype.status != AgentPrototypeStatus.draft:
            raise ValueError("Only draft prototypes can be deleted")

        self.repo.delete(prototype)
        return True

    def publish_prototype(
        self, prototype_id: int, data: PublishRequest, user_id: int
    ) -> AgentPrototype:
        """Publish a prototype (create new version snapshot)."""
        prototype = self.repo.get_by_id(prototype_id)
        if not prototype:
            raise ValueError("Prototype not found")

        # Check if version already exists
        if self.version_repo.version_exists(prototype_id, data.version):
            raise ValueError(f"Version {data.version} already exists")

        # Create version snapshot
        version = AgentPrototypeVersion(
            prototype_id=prototype_id,
            version=data.version,
            prompts_snapshot=prototype.prompts,
            config_snapshot={
                "model": prototype.model,
                "temperature": prototype.temperature,
                "max_tokens": prototype.max_tokens,
                "status": AgentPrototypeStatus.enabled.value,
            },
            change_summary=data.change_summary,
            created_by=user_id,
        )
        self.version_repo.create(version)

        # Update prototype status and version
        prototype.version = data.version
        prototype.status = AgentPrototypeStatus.enabled
        prototype.updated_by = user_id
        prototype.updated_at = datetime.utcnow()

        return self.repo.update(prototype)

    def rollback_prototype(
        self, prototype_id: int, data: RollbackRequest, user_id: int
    ) -> AgentPrototype:
        """Rollback prototype to a specific version."""
        prototype = self.repo.get_by_id(prototype_id)
        if not prototype:
            raise ValueError("Prototype not found")

        # Get the target version
        target_version = self.version_repo.get_by_version(prototype_id, data.version)
        if not target_version:
            raise ValueError(f"Version {data.version} not found")

        # Restore from snapshot
        prototype.prompts = target_version.prompts_snapshot
        prototype.model = target_version.config_snapshot.get("model", prototype.model)
        prototype.temperature = target_version.config_snapshot.get("temperature", prototype.temperature)
        prototype.max_tokens = target_version.config_snapshot.get("max_tokens", prototype.max_tokens)

        # Create new version record for rollback operation
        new_version = AgentPrototypeVersion(
            prototype_id=prototype_id,
            version=data.version,  # Same version as rollback target
            prompts_snapshot=target_version.prompts_snapshot,
            config_snapshot=target_version.config_snapshot,
            change_summary=f"Rollback to version {data.version}",
            created_by=user_id,
        )
        self.version_repo.create(new_version)

        # Update prototype
        prototype.version = data.version
        prototype.updated_by = user_id
        prototype.updated_at = datetime.utcnow()

        return self.repo.update(prototype)

    def toggle_status(self, prototype_id: int, user_id: int) -> AgentPrototype:
        """Toggle prototype status between enabled and disabled."""
        prototype = self.repo.get_by_id(prototype_id)
        if not prototype:
            raise ValueError("Prototype not found")

        if prototype.status == AgentPrototypeStatus.draft:
            raise ValueError("Cannot toggle draft prototype status")

        prototype.status = (
            AgentPrototypeStatus.disabled
            if prototype.status == AgentPrototypeStatus.enabled
            else AgentPrototypeStatus.enabled
        )
        prototype.updated_by = user_id
        prototype.updated_at = datetime.utcnow()

        return self.repo.update(prototype)

    def list_versions(self, prototype_id: int) -> list[AgentPrototypeVersion]:
        """List all versions for a prototype."""
        return list(self.version_repo.list_by_prototype(prototype_id))