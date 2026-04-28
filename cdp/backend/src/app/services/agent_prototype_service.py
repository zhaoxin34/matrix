"""Agent Prototype service."""

import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core import error_codes as codes
from app.core.error_codes import get_error_message
from app.models.agent_prototype import AgentPrototype, AgentPrototypePrompt, AgentPrototypeStatus, AgentPrototypeVersion
from app.repositories.agent_prototype_repo import (
    AgentPrototypePromptRepository,
    AgentPrototypeRepository,
    AgentPrototypeVersionRepository,
)
from app.schemas.agent_prototype import (
    AgentPrototypeCreate,
    AgentPrototypePromptCreate,
    AgentPrototypePromptUpdate,
    AgentPrototypePublish,
    AgentPrototypeRollback,
    AgentPrototypeUpdate,
)


class AgentPrototypeService:
    """Agent prototype business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = AgentPrototypeRepository(db)
        self.prompt_repo = AgentPrototypePromptRepository(db)
        self.version_repo = AgentPrototypeVersionRepository(db)

    def create_prototype(self, data: AgentPrototypeCreate, user_id: int) -> AgentPrototype:
        prototype = AgentPrototype(
            id=str(uuid.uuid4()),
            name=data.name,
            description=data.description,
            version="1.0.0",
            model=data.model,
            temperature=data.temperature,
            max_tokens=data.max_tokens,
            prompt_selections=data.prompt_selections or {},
            status=AgentPrototypeStatus.draft,
            created_by=user_id,
            updated_by=user_id,
        )
        prototype = self.repo.create(prototype)
        self.db.commit()
        return prototype

    def get_prototype(self, prototype_id: str) -> AgentPrototype:
        prototype = self.repo.find_by_id(prototype_id)
        if not prototype:
            raise HTTPException(status_code=codes.ERR_NOT_FOUND, detail=get_error_message(codes.ERR_NOT_FOUND))
        return prototype

    def update_prototype(self, prototype_id: str, data: AgentPrototypeUpdate, user_id: int) -> AgentPrototype:
        prototype = self.get_prototype(prototype_id)

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
        if data.prompt_selections is not None:
            prototype.prompt_selections = data.prompt_selections
        if data.status is not None:
            prototype.status = AgentPrototypeStatus(data.status.value)

        prototype.updated_by = user_id
        self.repo.update(prototype)
        self.db.commit()
        return prototype

    def delete_prototype(self, prototype_id: str) -> None:
        prototype = self.get_prototype(prototype_id)
        if prototype.status != AgentPrototypeStatus.draft:
            raise HTTPException(status_code=codes.ERR_BAD_REQUEST, detail="Only draft prototypes can be deleted")
        self.repo.delete(prototype)
        self.db.commit()

    def list_prototypes(
        self, page: int = 1, page_size: int = 20, status: Optional[AgentPrototypeStatus] = None
    ) -> tuple:
        items, total = self.repo.list(page=page, page_size=page_size, status=status)
        return items, total

    def publish_prototype(self, prototype_id: str, data: AgentPrototypePublish, user_id: int) -> AgentPrototypeVersion:
        prototype = self.get_prototype(prototype_id)

        # Generate new version
        if data.version:
            new_version = data.version
        else:
            # Auto increment: 1.0.0 -> 1.0.1
            parts = prototype.version.split(".")
            new_version = f"{parts[0]}.{parts[1]}.{int(parts[2]) + 1}"

        # Check if version already exists
        existing = self.version_repo.find_by_prototype_and_version(prototype_id, new_version)
        if existing:
            raise HTTPException(status_code=codes.ERR_CONFLICT, detail=f"Version {new_version} already exists")

        # Create config snapshot
        config_snapshot = {
            "model": prototype.model,
            "temperature": prototype.temperature,
            "max_tokens": prototype.max_tokens,
            "status": prototype.status.value,
        }

        # Create prompt snapshot
        prompt_snapshot = prototype.prompt_selections

        # Create version record
        version = AgentPrototypeVersion(
            id=str(uuid.uuid4()),
            prototype_id=prototype_id,
            version=new_version,
            config_snapshot=config_snapshot,
            prompt_snapshot=prompt_snapshot,
            change_summary=data.change_summary,
            created_by=user_id,
        )
        version = self.version_repo.create(version)

        # Update prototype
        prototype.version = new_version
        prototype.status = AgentPrototypeStatus.published
        prototype.updated_by = user_id
        self.repo.update(prototype)

        self.db.commit()
        return version

    def rollback_prototype(self, prototype_id: str, data: AgentPrototypeRollback, user_id: int) -> AgentPrototype:
        prototype = self.get_prototype(prototype_id)

        # Find target version
        target_version = self.version_repo.find_by_prototype_and_version(prototype_id, data.version)
        if not target_version:
            raise HTTPException(status_code=codes.ERR_NOT_FOUND, detail=f"Version {data.version} not found")

        # Check if already current version
        if prototype.version == data.version:
            raise HTTPException(status_code=codes.ERR_BAD_REQUEST, detail="Already at this version")

        # Restore from snapshot
        config = target_version.config_snapshot
        prototype.model = config["model"]
        prototype.temperature = config["temperature"]
        prototype.max_tokens = config["max_tokens"]
        prototype.prompt_selections = target_version.prompt_snapshot

        # Generate new version for rollback (as a new release)
        parts = prototype.version.split(".")
        rollback_version = f"{parts[0]}.{parts[1]}.{int(parts[2]) + 1}"

        # Create new version record for rollback
        new_version_record = AgentPrototypeVersion(
            id=str(uuid.uuid4()),
            prototype_id=prototype_id,
            version=rollback_version,
            config_snapshot=target_version.config_snapshot,
            prompt_snapshot=target_version.prompt_snapshot,
            change_summary=f"Rollback to {data.version}",
            created_by=user_id,
        )
        self.version_repo.create(new_version_record)

        # Update prototype to new version
        prototype.version = rollback_version
        prototype.status = AgentPrototypeStatus.published
        prototype.updated_by = user_id
        self.repo.update(prototype)

        self.db.commit()
        return prototype

    def get_version_history(self, prototype_id: str) -> list[AgentPrototypeVersion]:
        # Verify prototype exists
        self.get_prototype(prototype_id)
        return self.version_repo.list_by_prototype(prototype_id)


class AgentPrototypePromptService:
    """Agent prototype prompt business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = AgentPrototypePromptRepository(db)
        self.prototype_repo = AgentPrototypeRepository(db)

    def create_prompt(self, data: AgentPrototypePromptCreate, user_id: int) -> AgentPrototypePrompt:
        # Verify prototype exists
        prototype = self.prototype_repo.find_by_id(data.prototype_id)
        if not prototype:
            raise HTTPException(status_code=codes.ERR_NOT_FOUND, detail=get_error_message(codes.ERR_NOT_FOUND))

        prompt = AgentPrototypePrompt(
            id=str(uuid.uuid4()),
            prototype_id=data.prototype_id,
            type=data.type.value,
            name=data.name,
            content=data.content,
            version=data.version,
            order_index=data.order_index,
            created_by=user_id,
            updated_by=user_id,
        )
        prompt = self.repo.create(prompt)
        self.db.commit()
        return prompt

    def get_prompt(self, prompt_id: str) -> AgentPrototypePrompt:
        prompt = self.repo.find_by_id(prompt_id)
        if not prompt:
            raise HTTPException(status_code=codes.ERR_NOT_FOUND, detail=get_error_message(codes.ERR_NOT_FOUND))
        return prompt

    def update_prompt(self, prompt_id: str, data: AgentPrototypePromptUpdate, user_id: int) -> AgentPrototypePrompt:
        prompt = self.get_prompt(prompt_id)

        if data.name is not None:
            prompt.name = data.name
        if data.content is not None:
            prompt.content = data.content
        if data.order_index is not None:
            prompt.order_index = data.order_index

        prompt.updated_by = user_id
        self.repo.update(prompt)
        self.db.commit()
        return prompt

    def delete_prompt(self, prompt_id: str) -> None:
        prompt = self.get_prompt(prompt_id)
        self.repo.delete(prompt)
        self.db.commit()

    def list_prompts(self, prototype_id: str) -> list[AgentPrototypePrompt]:
        return self.repo.list_by_prototype(prototype_id)
