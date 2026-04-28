"""Agent Prototype Repository"""

from typing import Optional

from sqlalchemy import Select, func
from sqlalchemy.orm import Session

from app.models.agent_prototype import AgentPrototype, AgentPrototypeStatus, AgentPrototypeVersion


class AgentPrototypeRepository:
    """Repository for Agent Prototype CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> AgentPrototype:
        """Create a new agent prototype."""
        prototype = AgentPrototype(**data)
        self.db.add(prototype)
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def get_by_id(self, prototype_id: int) -> Optional[AgentPrototype]:
        """Get agent prototype by ID."""
        stmt = Select(AgentPrototype).where(AgentPrototype.id == prototype_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[AgentPrototypeStatus] = None,
        keyword: Optional[str] = None,
    ) -> tuple[list[AgentPrototype], int]:
        """List agent prototypes with pagination and filters."""
        stmt = Select(AgentPrototype)

        if status:
            stmt = stmt.where(AgentPrototype.status == status)

        if keyword:
            stmt = stmt.where((AgentPrototype.name.contains(keyword)) | (AgentPrototype.description.contains(keyword)))

        # Count total
        count_stmt = Select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Apply pagination
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        stmt = stmt.order_by(AgentPrototype.created_at.desc())

        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def update(self, prototype: AgentPrototype, data: dict) -> AgentPrototype:
        """Update an agent prototype."""
        for key, value in data.items():
            if value is not None:
                setattr(prototype, key, value)
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def delete(self, prototype: AgentPrototype) -> None:
        """Delete an agent prototype."""
        self.db.delete(prototype)
        self.db.flush()


class AgentPrototypeVersionRepository:
    """Repository for Agent Prototype Version operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> AgentPrototypeVersion:
        """Create a new version snapshot."""
        version = AgentPrototypeVersion(**data)
        self.db.add(version)
        self.db.flush()
        self.db.refresh(version)
        return version

    def get_by_prototype_and_version(self, prototype_id: int, version: str) -> Optional[AgentPrototypeVersion]:
        """Get version by prototype ID and version number."""
        stmt = Select(AgentPrototypeVersion).where(
            AgentPrototypeVersion.prototype_id == prototype_id,
            AgentPrototypeVersion.version == version,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_prototype(self, prototype_id: int) -> list[AgentPrototypeVersion]:
        """List all versions for a prototype."""
        stmt = (
            Select(AgentPrototypeVersion)
            .where(AgentPrototypeVersion.prototype_id == prototype_id)
            .order_by(AgentPrototypeVersion.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_latest_version(self, prototype_id: int) -> Optional[AgentPrototypeVersion]:
        """Get the latest version for a prototype."""
        stmt = (
            Select(AgentPrototypeVersion)
            .where(AgentPrototypeVersion.prototype_id == prototype_id)
            .order_by(AgentPrototypeVersion.created_at.desc())
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()
