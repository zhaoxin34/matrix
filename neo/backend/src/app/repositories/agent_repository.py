"""Agent repository for database operations."""

from datetime import UTC, datetime

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.agent import Agent, AgentStatus


class AgentRepository:
    """Repository for Agent database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, agent: Agent) -> Agent:
        """Create a new Agent."""
        self.db.add(agent)
        self.db.flush()
        self.db.refresh(agent)
        return agent

    def get_by_id(self, agent_id: int) -> Agent | None:
        """Get an Agent by ID."""
        stmt = select(Agent).where(Agent.id == agent_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_name(self, workspace_id: int, name: str) -> Agent | None:
        """Get an Agent by workspace_id and name."""
        stmt = select(Agent).where(
            and_(
                Agent.workspace_id == workspace_id,
                Agent.name == name,
            ),
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def list_agents(
        self,
        workspace_id: int,
        status: str | None = None,
        prototype_id: int | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Agent], int]:
        """List Agents with filters and pagination.

        Args:
            workspace_id: Filter by workspace
            status: Filter by status (enabled/disabled, excludes deleted by default)
            prototype_id: Filter by prototype
            search: Search in name/description
            page: Page number (1-based)
            page_size: Items per page

        Returns:
            Tuple of (agents, total_count)
        """
        stmt = select(Agent).where(Agent.workspace_id == workspace_id)

        # Exclude deleted by default unless explicitly filtering for it
        if status:
            stmt = stmt.where(Agent.status == status)
        else:
            stmt = stmt.where(Agent.status != AgentStatus.DELETED.value)

        # Filter by prototype
        if prototype_id is not None:
            stmt = stmt.where(Agent.prototype_id == prototype_id)

        # Search in name and description
        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Agent.name.ilike(search_pattern),
                    Agent.description.ilike(search_pattern),
                ),
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate and order
        stmt = stmt.order_by(Agent.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        agents = list(result.scalars().all())

        return agents, total

    def update(self, agent: Agent, data: dict) -> Agent:
        """Update an Agent with data dictionary.

        Args:
            agent: Agent instance to update
            data: Dictionary of fields to update

        Returns:
            Updated Agent
        """
        # Fields that cannot be modified
        forbidden_fields = {"id", "prototype_id", "prototype_version", "workspace_id", "created_by", "created_at"}

        for field, value in data.items():
            if field not in forbidden_fields and hasattr(agent, field):
                setattr(agent, field, value)

        agent.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(agent)
        return agent

    def update_status(self, agent: Agent, status: str) -> Agent:
        """Update Agent status.

        Args:
            agent: Agent instance
            status: New status (enabled/disabled/deleted)

        Returns:
            Updated Agent
        """
        agent.status = status
        agent.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(agent)
        return agent

    def soft_delete(self, agent: Agent) -> Agent:
        """Soft delete an Agent (set status to deleted).

        Args:
            agent: Agent instance

        Returns:
            Updated Agent
        """
        return self.update_status(agent, AgentStatus.DELETED.value)

    def exists_in_workspace(self, workspace_id: int, name: str, exclude_id: int | None = None) -> bool:
        """Check if an Agent with the same name exists in the workspace.

        Args:
            workspace_id: Workspace ID
            name: Agent name
            exclude_id: Agent ID to exclude (for update operations)

        Returns:
            True if exists, False otherwise
        """
        stmt = select(func.count(Agent.id)).where(
            and_(
                Agent.workspace_id == workspace_id,
                Agent.name == name,
                Agent.status != AgentStatus.DELETED.value,
            ),
        )
        if exclude_id:
            stmt = stmt.where(Agent.id != exclude_id)
        count = self.db.execute(stmt).scalar_one()
        return count > 0

    def count_by_prototype(self, prototype_id: int) -> int:
        """Count Agents using a specific Prototype.

        Args:
            prototype_id: Prototype ID

        Returns:
            Number of Agents
        """
        stmt = select(func.count(Agent.id)).where(
            and_(
                Agent.prototype_id == prototype_id,
                Agent.status != AgentStatus.DELETED.value,
            ),
        )
        return self.db.execute(stmt).scalar_one()

    def has_active_tasks(self, agent_id: int) -> bool:
        """Check if an Agent has active (in-progress) tasks.

        This is a placeholder - actual implementation depends on Task model.
        For now, returns False.

        Args:
            agent_id: Agent ID

        Returns:
            True if has active tasks, False otherwise
        """
        # TODO: Implement when Task model is available
        return False
