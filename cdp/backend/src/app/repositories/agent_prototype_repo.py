"""Agent Prototype repository."""

from typing import Sequence

from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.models.agent_prototype import AgentPrototype, AgentPrototypeStatus
from app.models.agent_prototype_version import AgentPrototypeVersion


class AgentPrototypeRepository:
    """Repository for Agent Prototype CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, prototype: AgentPrototype) -> AgentPrototype:
        """Create a new agent prototype."""
        self.db.add(prototype)
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def get_by_id(self, prototype_id: int) -> AgentPrototype | None:
        """Get agent prototype by ID."""
        stmt = select(AgentPrototype).where(AgentPrototype.id == prototype_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        page: int = 1,
        page_size: int = 20,
        status: AgentPrototypeStatus | None = None,
        keyword: str | None = None,
    ) -> tuple[Sequence[AgentPrototype], int]:
        """List agent prototypes with pagination and filters."""
        stmt = select(AgentPrototype)

        if status:
            stmt = stmt.where(AgentPrototype.status == status)

        if keyword:
            stmt = stmt.where(
                AgentPrototype.name.ilike(f"%{keyword}%")
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.order_by(AgentPrototype.created_at.desc()).offset(offset).limit(page_size)

        items = self.db.execute(stmt).scalars().all()
        return items, total

    def update(self, prototype: AgentPrototype) -> AgentPrototype:
        """Update an agent prototype."""
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def delete(self, prototype: AgentPrototype) -> None:
        """Delete an agent prototype."""
        self.db.delete(prototype)
        self.db.flush()

    def exists(self, prototype_id: int) -> bool:
        """Check if prototype exists."""
        stmt = select(func.count()).select_from(AgentPrototype).where(AgentPrototype.id == prototype_id)
        count = self.db.execute(stmt).scalar()
        return count > 0


class AgentPrototypeVersionRepository:
    """Repository for Agent Prototype Version operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, version: AgentPrototypeVersion) -> AgentPrototypeVersion:
        """Create a new prototype version."""
        self.db.add(version)
        self.db.flush()
        self.db.refresh(version)
        return version

    def get_by_version(
        self, prototype_id: int, version: str
    ) -> AgentPrototypeVersion | None:
        """Get version by prototype ID and version number."""
        stmt = select(AgentPrototypeVersion).where(
            AgentPrototypeVersion.prototype_id == prototype_id,
            AgentPrototypeVersion.version == version,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_prototype(
        self, prototype_id: int
    ) -> Sequence[AgentPrototypeVersion]:
        """List all versions for a prototype."""
        stmt = (
            select(AgentPrototypeVersion)
            .where(AgentPrototypeVersion.prototype_id == prototype_id)
            .order_by(AgentPrototypeVersion.created_at.desc())
        )
        return self.db.execute(stmt).scalars().all()

    def get_latest_version(self, prototype_id: int) -> AgentPrototypeVersion | None:
        """Get the latest version for a prototype."""
        stmt = (
            select(AgentPrototypeVersion)
            .where(AgentPrototypeVersion.prototype_id == prototype_id)
            .order_by(AgentPrototypeVersion.created_at.desc())
            .limit(1)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def version_exists(self, prototype_id: int, version: str) -> bool:
        """Check if version exists for prototype."""
        stmt = select(func.count()).select_from(AgentPrototypeVersion).where(
            AgentPrototypeVersion.prototype_id == prototype_id,
            AgentPrototypeVersion.version == version,
        )
        count = self.db.execute(stmt).scalar()
        return count > 0