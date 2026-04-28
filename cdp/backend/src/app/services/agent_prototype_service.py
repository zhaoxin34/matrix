"""Agent Prototype Service"""

from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.agent_prototype import AgentPrototypeStatus
from app.repositories.agent_prototype_repo import AgentPrototypeRepository, AgentPrototypeVersionRepository
from app.schemas.agent_prototype import (
    AgentPrototypeResponse,
    CreateAgentPrototype,
    PublishRequest,
    RollbackRequest,
    UpdateAgentPrototype,
    VersionResponse,
)


class AgentPrototypeService:
    """Service for agent prototype operations."""

    def __init__(self, db: Session):
        self.db = db
        self.prototype_repo = AgentPrototypeRepository(db)
        self.version_repo = AgentPrototypeVersionRepository(db)

    def _increment_version(self, current_version: str) -> str:
        """Auto-increment semver version."""
        parts = current_version.split(".")
        if len(parts) == 3:
            major, minor, patch = parts
            new_patch = int(patch) + 1
            return f"{major}.{minor}.{new_patch}"
        return f"{current_version}.1"

    def _build_prompts_dict(self, prompts) -> dict:
        """Convert prompts model to dict."""
        if isinstance(prompts, dict):
            return prompts
        return {
            "soul": prompts.soul or "",
            "memory": prompts.memory or "",
            "reasoning": prompts.reasoning or "",
            "agents": prompts.agents or "",
            "workflow": prompts.workflow or "",
            "communication": prompts.communication or "",
        }

    def create_prototype(self, data: CreateAgentPrototype, user_id: int) -> AgentPrototypeResponse:
        """Create a new agent prototype."""
        prompts_dict = self._build_prompts_dict(data.prompts) if data.prompts else {}

        prototype_data = {
            "name": data.name,
            "description": data.description,
            "model": data.model,
            "temperature": data.temperature or 0.7,
            "max_tokens": data.max_tokens or 4096,
            "prompts": prompts_dict,
            "status": AgentPrototypeStatus.draft,
            "created_by": user_id,
        }

        prototype = self.prototype_repo.create(prototype_data)
        self.db.commit()

        return AgentPrototypeResponse.model_validate(prototype)

    def get_prototype(self, prototype_id: int) -> AgentPrototypeResponse:
        """Get prototype by ID."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=404, detail="Prototype not found")
        return AgentPrototypeResponse.model_validate(prototype)

    def list_prototypes(
        self, page: int = 1, page_size: int = 20, status: Optional[str] = None, keyword: Optional[str] = None
    ) -> dict:
        """List prototypes with pagination."""
        status_filter = AgentPrototypeStatus(status) if status else None
        prototypes, total = self.prototype_repo.list(
            page=page, page_size=page_size, status=status_filter, keyword=keyword
        )

        return {
            "items": [AgentPrototypeResponse.model_validate(p) for p in prototypes],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    def update_prototype(self, prototype_id: int, data: UpdateAgentPrototype) -> AgentPrototypeResponse:
        """Update an agent prototype."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=404, detail="Prototype not found")

        update_data = data.model_dump(exclude_unset=True)

        if "prompts" in update_data and update_data["prompts"]:
            update_data["prompts"] = self._build_prompts_dict(update_data["prompts"])

        if update_data.get("status"):
            update_data["status"] = AgentPrototypeStatus(update_data["status"])

        if update_data.get("updated_by") is None:
            update_data["updated_by"] = prototype.created_by

        prototype = self.prototype_repo.update(prototype, update_data)
        self.db.commit()

        return AgentPrototypeResponse.model_validate(prototype)

    def delete_prototype(self, prototype_id: int) -> None:
        """Delete an agent prototype."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=404, detail="Prototype not found")

        if prototype.status != AgentPrototypeStatus.draft:
            raise HTTPException(status_code=400, detail="Can only delete draft prototypes")

        self.prototype_repo.delete(prototype)
        self.db.commit()

    def publish_prototype(self, prototype_id: int, data: PublishRequest, user_id: int) -> AgentPrototypeResponse:
        """Publish a prototype and create a new version."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=404, detail="Prototype not found")

        if prototype.status not in (AgentPrototypeStatus.draft, AgentPrototypeStatus.disabled):
            raise HTTPException(status_code=400, detail="Can only publish draft or disabled prototypes")

        latest_version = self.version_repo.get_latest_version(prototype_id)
        if latest_version:
            new_version = self._increment_version(latest_version.version)
        else:
            new_version = data.version or "1.0.0"

        if data.version:
            new_version = data.version

        existing = self.version_repo.get_by_prototype_and_version(prototype_id, new_version)
        if existing:
            raise HTTPException(status_code=409, detail=f"Version {new_version} already exists")

        config_snapshot = {
            "model": prototype.model,
            "temperature": prototype.temperature,
            "max_tokens": prototype.max_tokens,
            "status": prototype.status.value,
        }

        version_data = {
            "prototype_id": prototype_id,
            "version": new_version,
            "prompts_snapshot": prototype.prompts,
            "config_snapshot": config_snapshot,
            "change_summary": data.change_summary or "",
            "created_by": user_id,
        }

        self.version_repo.create(version_data)

        prototype.version = new_version
        prototype.status = AgentPrototypeStatus.enabled
        prototype.updated_by = user_id

        self.db.commit()
        self.db.refresh(prototype)

        return AgentPrototypeResponse.model_validate(prototype)

    def list_versions(self, prototype_id: int) -> list[VersionResponse]:
        """List all versions for a prototype."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=404, detail="Prototype not found")

        versions = self.version_repo.list_by_prototype(prototype_id)
        return [VersionResponse.model_validate(v) for v in versions]

    def rollback_prototype(self, prototype_id: int, data: RollbackRequest, user_id: int) -> AgentPrototypeResponse:
        """Rollback prototype to a specific version."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=404, detail="Prototype not found")

        target_version = self.version_repo.get_by_prototype_and_version(prototype_id, data.version)
        if not target_version:
            raise HTTPException(status_code=404, detail=f"Version {data.version} not found")

        if prototype.version == data.version:
            raise HTTPException(status_code=400, detail="Already at this version")

        latest_version = self.version_repo.get_latest_version(prototype_id)
        rollback_version_num = self._increment_version(latest_version.version)

        version_data = {
            "prototype_id": prototype_id,
            "version": rollback_version_num,
            "prompts_snapshot": target_version.prompts_snapshot,
            "config_snapshot": target_version.config_snapshot,
            "change_summary": f"Rollback to {data.version}",
            "created_by": user_id,
        }

        self.version_repo.create(version_data)

        prototype.prompts = target_version.prompts_snapshot
        prototype.model = target_version.config_snapshot.get("model", prototype.model)
        prototype.temperature = target_version.config_snapshot.get("temperature", prototype.temperature)
        prototype.max_tokens = target_version.config_snapshot.get("max_tokens", prototype.max_tokens)
        prototype.version = rollback_version_num
        prototype.updated_by = user_id

        self.db.commit()
        self.db.refresh(prototype)

        return AgentPrototypeResponse.model_validate(prototype)

    def toggle_status(self, prototype_id: int, user_id: int) -> AgentPrototypeResponse:
        """Toggle prototype status between enabled and disabled."""
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=404, detail="Prototype not found")

        if prototype.status not in (AgentPrototypeStatus.enabled, AgentPrototypeStatus.disabled):
            raise HTTPException(status_code=400, detail="Can only toggle enabled/disabled prototypes")

        if prototype.status == AgentPrototypeStatus.enabled:
            prototype.status = AgentPrototypeStatus.disabled
        else:
            prototype.status = AgentPrototypeStatus.enabled

        prototype.updated_by = user_id
        self.db.commit()
        self.db.refresh(prototype)

        return AgentPrototypeResponse.model_validate(prototype)
