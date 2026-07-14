"""Agent Prototype repository for database operations."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.agent_prototype import AgentPrototype, AgentStatus
from app.models.agent_prototype_version import AgentPrototypeVersion


class AgentPrototypeRepository:
    """Repository for AgentPrototype database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, prototype: AgentPrototype) -> AgentPrototype:
        """Create a new Agent Prototype."""
        if not prototype.code:
            prototype.code = f"pt_{uuid.uuid4().hex[:16]}"
        self.db.add(prototype)
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def get_by_id(self, prototype_id: int) -> AgentPrototype | None:
        """Get an Agent Prototype by ID."""
        stmt = select(AgentPrototype).where(AgentPrototype.id == prototype_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_code(self, code: str) -> AgentPrototype | None:
        """Get an Agent Prototype by code."""
        stmt = select(AgentPrototype).where(AgentPrototype.code == code)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def list_prototypes(
        self,
        status: AgentStatus | None = None,
        agent_type: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[AgentPrototype], int]:
        """List Agent Prototypes with filters and pagination."""
        from app.models.agent_prototype import AgentType

        stmt = select(AgentPrototype)

        if status:
            stmt = stmt.where(AgentPrototype.status == status)
        if agent_type:
            try:
                type_enum = AgentType(agent_type.lower())
                # MySQL stores uppercase, Python enum is lowercase string
                stmt = stmt.where(func.upper(AgentPrototype.type) == type_enum.value.upper())
            except ValueError:
                pass  # Invalid type, return empty result
        if search:
            stmt = stmt.where(AgentPrototype.name.ilike(f"%{search}%"))

        # Count total - build separate count statement without pagination
        count_stmt = select(func.count(AgentPrototype.id))
        if status:
            count_stmt = count_stmt.where(AgentPrototype.status == status)
        if agent_type:
            try:
                type_enum = AgentType(agent_type.lower())
                count_stmt = count_stmt.where(func.upper(AgentPrototype.type) == type_enum.value.upper())
            except ValueError:
                pass
        if search:
            count_stmt = count_stmt.where(AgentPrototype.name.ilike(f"%{search}%"))
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate
        stmt = stmt.order_by(AgentPrototype.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        prototypes = list(result.scalars().all())

        return prototypes, total

    def update(self, prototype: AgentPrototype) -> AgentPrototype:
        """Update an Agent Prototype."""
        prototype.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def delete(self, prototype: AgentPrototype) -> None:
        """Hard delete an Agent Prototype (only for draft status)."""
        self.db.delete(prototype)
        self.db.flush()

    def update_status(self, prototype: AgentPrototype, status: AgentStatus) -> AgentPrototype:
        """Update the status of an Agent Prototype."""
        prototype.status = status
        prototype.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def publish(
        self,
        prototype: AgentPrototype,
        new_version: str,
        created_by: int,
        change_summary: str | None = None,
        is_rollback: bool = False,
    ) -> AgentPrototype:
        """Publish a new version of the Agent Prototype."""
        # Create version snapshot
        version = AgentPrototypeVersion(
            agent_prototype_id=prototype.id,
            version=new_version,
            prompts_snapshot=prototype.prompts,
            config_snapshot=prototype.config,
            change_summary=change_summary,
            is_rollback=is_rollback,
            created_by=created_by,
        )
        self.db.add(version)

        # Update prototype with new version
        prototype.version = new_version
        prototype.status = AgentStatus.ENABLED
        prototype.updated_at = datetime.now(UTC)

        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def rollback_to_version(
        self,
        prototype: AgentPrototype,
        target_version: AgentPrototypeVersion,
        created_by: int,
    ) -> AgentPrototype:
        """Rollback Agent Prototype to a specific version."""
        # Create new version entry marking rollback
        rollback_version = AgentPrototypeVersion(
            agent_prototype_id=prototype.id,
            version=target_version.version,
            prompts_snapshot=target_version.prompts_snapshot,
            config_snapshot=target_version.config_snapshot,
            change_summary=f"Rollback to version {target_version.version}",
            is_rollback=True,
            created_by=created_by,
        )
        self.db.add(rollback_version)

        # Update prototype with rollback content
        prototype.prompts = target_version.prompts_snapshot
        prototype.config = target_version.config_snapshot
        prototype.version = target_version.version
        prototype.status = AgentStatus.ENABLED
        prototype.updated_at = datetime.now(UTC)

        self.db.flush()
        self.db.refresh(prototype)
        return prototype

    def calculate_next_version(self, prototype_id: int) -> str:
        """Calculate the next version number for a prototype."""
        # Get the latest version for this prototype
        latest_version = (
            self.db.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype_id)
            .order_by(AgentPrototypeVersion.created_at.desc())
            .first()
        )

        if not latest_version:
            return "1.0.0"

        # Parse version and increment patch
        parts = latest_version.version.split(".")
        if len(parts) == 3:
            major, minor, patch = parts
            new_patch = int(patch) + 1
            return f"{major}.{minor}.{new_patch}"

        return "1.0.0"


class AgentPrototypeVersionRepository:
    """Repository for AgentPrototypeVersion database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_versions_by_prototype(self, prototype_id: int) -> list[AgentPrototypeVersion]:
        """Get all versions for an agent prototype."""
        return (
            self.db.query(AgentPrototypeVersion)
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype_id)
            .order_by(AgentPrototypeVersion.created_at.desc())
            .all()
        )

    def get_version_by_id(self, version_id: int) -> AgentPrototypeVersion | None:
        """Get a specific version by ID."""
        return self.db.query(AgentPrototypeVersion).filter(AgentPrototypeVersion.id == version_id).first()

    def get_version(self, prototype_id: int, version: str) -> AgentPrototypeVersion | None:
        """Get a specific version by prototype_id and version string."""
        return (
            self.db.query(AgentPrototypeVersion)
            .filter(
                AgentPrototypeVersion.agent_prototype_id == prototype_id,
                AgentPrototypeVersion.version == version,
            )
            .first()
        )

    def count_versions(self, prototype_id: int) -> int:
        """Count total versions for a prototype."""
        return (
            self.db.query(func.count(AgentPrototypeVersion.id))
            .filter(AgentPrototypeVersion.agent_prototype_id == prototype_id)
            .scalar_one()
        )
