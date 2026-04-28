"""Agent Prototype repository."""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.agent_prototype import AgentPrototype, AgentPrototypePrompt, AgentPrototypeVersion


class AgentPrototypeRepository:
    """Agent prototype data access layer."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, prototype: AgentPrototype) -> AgentPrototype:
        self.db.add(prototype)
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def find_by_id(self, prototype_id: str) -> Optional[AgentPrototype]:
        return self.db.query(AgentPrototype).filter(AgentPrototype.id == prototype_id).first()

    def update(self, prototype: AgentPrototype) -> AgentPrototype:
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def delete(self, prototype: AgentPrototype) -> None:
        self.db.delete(prototype)
        self.db.flush()

    def list(self, page: int = 1, page_size: int = 20, status=None) -> tuple[list[AgentPrototype], int]:
        q = self.db.query(AgentPrototype)
        if status:
            q = q.filter(AgentPrototype.status == status)
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total


class AgentPrototypePromptRepository:
    """Agent prototype prompt data access layer."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, prompt: AgentPrototypePrompt) -> AgentPrototypePrompt:
        self.db.add(prompt)
        self.db.flush()
        self.db.refresh(prompt)
        return prompt

    def find_by_id(self, prompt_id: str) -> Optional[AgentPrototypePrompt]:
        return self.db.query(AgentPrototypePrompt).filter(AgentPrototypePrompt.id == prompt_id).first()

    def find_by_prototype_and_type_version(
        self, prototype_id: str, type: str, version: str
    ) -> Optional[AgentPrototypePrompt]:
        return (
            self.db.query(AgentPrototypePrompt)
            .filter(
                AgentPrototypePrompt.prototype_id == prototype_id,
                AgentPrototypePrompt.type == type,
                AgentPrototypePrompt.version == version,
            )
            .first()
        )

    def update(self, prompt: AgentPrototypePrompt) -> AgentPrototypePrompt:
        self.db.flush()
        self.db.refresh(prompt)
        return prompt

    def delete(self, prompt: AgentPrototypePrompt) -> None:
        self.db.delete(prompt)
        self.db.flush()

    def list_by_prototype(self, prototype_id: str) -> list[AgentPrototypePrompt]:
        return (
            self.db.query(AgentPrototypePrompt)
            .filter(AgentPrototypePrompt.prototype_id == prototype_id)
            .order_by(AgentPrototypePrompt.type, AgentPrototypePrompt.order_index)
            .all()
        )


class AgentPrototypeVersionRepository:
    """Agent prototype version history data access layer."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, version: AgentPrototypeVersion) -> AgentPrototypeVersion:
        self.db.add(version)
        self.db.flush()
        self.db.refresh(version)
        return version

    def find_by_prototype_and_version(self, prototype_id: str, version: str) -> Optional[AgentPrototypeVersion]:
        return (
            self.db.query(AgentPrototypeVersion)
            .filter(
                AgentPrototypeVersion.prototype_id == prototype_id,
                AgentPrototypeVersion.version == version,
            )
            .first()
        )

    def list_by_prototype(self, prototype_id: str) -> list[AgentPrototypeVersion]:
        return (
            self.db.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.prototype_id == prototype_id)
            .order_by(AgentPrototypeVersion.created_at.desc())
            .all()
        )
