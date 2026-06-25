"""Agent service for business logic."""

from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_AGENT_NAME_EXISTS,
    ERR_AGENT_NOT_FOUND,
    ERR_AGENT_STATUS_NOT_ALLOWED,
    ERR_CONFLICT,
    ERR_NOT_FOUND,
    ERR_PROTOTYPE_NOT_ENABLED,
    ERR_PROTOTYPE_NOT_FOUND,
    ERR_PROTOTYPE_VERSION_NOT_FOUND,
)
from app.core.exceptions import BusinessException
from app.models.agent import Agent, AgentStatus
from app.models.agent_prototype import AgentPrototype
from app.models.agent_prototype import AgentStatus as PrototypeStatus
from app.repositories.agent_prototype_repository import AgentPrototypeRepository, AgentPrototypeVersionRepository
from app.repositories.agent_repository import AgentRepository
from app.repositories.workspace_repository import get_workspace_by_code


class AgentService:
    """Service for Agent business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.agent_repo = AgentRepository(db)
        self.prototype_repo = AgentPrototypeRepository(db)
        self.version_repo = AgentPrototypeVersionRepository(db)

    def _get_workspace_id(self, workspace_code: str) -> int:
        """Get workspace ID by code."""
        workspace = get_workspace_by_code(self.db, workspace_code)
        if not workspace:
            raise BusinessException(ERR_NOT_FOUND, f"Workspace '{workspace_code}' not found")
        return workspace.id

    def _validate_prototype(self, prototype_id: int, version: str) -> AgentPrototype:
        """Validate that the prototype exists, is enabled, and has the specified version.

        Args:
            prototype_id: Prototype ID
            version: Expected version

        Returns:
            The validated Prototype

        Raises:
            BusinessException if validation fails
        """
        # Check prototype exists
        prototype = self.prototype_repo.get_by_id(prototype_id)
        if not prototype:
            raise BusinessException(ERR_PROTOTYPE_NOT_FOUND, f"Prototype {prototype_id} not found")

        # Check prototype is enabled
        if prototype.status != PrototypeStatus.ENABLED:
            raise BusinessException(ERR_PROTOTYPE_NOT_ENABLED, "Prototype must be enabled to create Agent")

        # Check version exists
        version_obj = self.version_repo.get_version(prototype_id, version)
        if not version_obj:
            raise BusinessException(ERR_PROTOTYPE_VERSION_NOT_FOUND, f"Version {version} not found for this prototype")

        return prototype

    def create_agent(self, workspace_code: str, data: dict, user_id: int) -> Agent:
        """Create a new Agent.

        Args:
            workspace_code: Workspace code
            data: Agent creation data
            user_id: Current user ID

        Returns:
            Created Agent

        Raises:
            BusinessException if validation fails
        """
        workspace_id = self._get_workspace_id(workspace_code)

        # Validate name uniqueness in workspace
        if self.agent_repo.exists_in_workspace(workspace_id, data["name"]):
            raise BusinessException(
                ERR_AGENT_NAME_EXISTS,
                f"Agent name '{data['name']}' already exists in this workspace",
            )

        # Validate prototype
        prototype = self._validate_prototype(data["prototype_id"], data["prototype_version"])

        # Create agent
        agent = Agent(
            name=data["name"],
            description=data.get("description"),
            prototype_id=data["prototype_id"],
            prototype_version=data["prototype_version"],
            workspace_id=workspace_id,
            model=data.get("model", prototype.model),  # Use prototype's model if not specified
            skills=data.get("skills", []),
            config=data.get("config", {}),
            status=AgentStatus.ENABLED.value,
            created_by=user_id,
        )

        return self.agent_repo.create(agent)

    def get_agent(self, workspace_code: str, agent_id: int) -> Agent:
        """Get an Agent by ID.

        Args:
            workspace_code: Workspace code
            agent_id: Agent ID

        Returns:
            Agent

        Raises:
            BusinessException if not found
        """
        workspace_id = self._get_workspace_id(workspace_code)

        agent = self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise BusinessException(ERR_AGENT_NOT_FOUND, f"Agent {agent_id} not found")

        # Verify agent belongs to the workspace
        if agent.workspace_id != workspace_id:
            raise BusinessException(ERR_AGENT_NOT_FOUND, f"Agent {agent_id} not found in workspace '{workspace_code}'")

        # Don't return deleted agents
        if agent.status == AgentStatus.DELETED.value:
            raise BusinessException(ERR_AGENT_NOT_FOUND, f"Agent {agent_id} not found")

        return agent

    def list_agents(
        self,
        workspace_code: str,
        status: str | None = None,
        prototype_id: int | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Agent], int]:
        """List Agents in a workspace.

        Args:
            workspace_code: Workspace code
            status: Filter by status (enabled/disabled, excludes deleted by default)
            prototype_id: Filter by prototype
            search: Search in name/description
            page: Page number
            page_size: Items per page

        Returns:
            Tuple of (agents, total_count)
        """
        workspace_id = self._get_workspace_id(workspace_code)
        return self.agent_repo.list_agents(
            workspace_id=workspace_id,
            status=status,
            prototype_id=prototype_id,
            search=search,
            page=page,
            page_size=page_size,
        )

    def update_agent(self, workspace_code: str, agent_id: int, data: dict) -> Agent:
        """Update an Agent.

        Args:
            workspace_code: Workspace code
            agent_id: Agent ID
            data: Update data

        Returns:
            Updated Agent

        Raises:
            BusinessException if validation fails
        """
        agent = self.get_agent(workspace_code, agent_id)

        # Check status allows update
        if agent.status == AgentStatus.DELETED.value:
            raise BusinessException(ERR_AGENT_STATUS_NOT_ALLOWED, "Cannot update a deleted Agent")

        # Validate name uniqueness if changing
        if "name" in data and data["name"] != agent.name:
            if self.agent_repo.exists_in_workspace(agent.workspace_id, data["name"], exclude_id=agent.id):
                raise BusinessException(
                    ERR_AGENT_NAME_EXISTS,
                    f"Agent name '{data['name']}' already exists in this workspace",
                )

        return self.agent_repo.update(agent, data)

    def delete_agent(self, workspace_code: str, agent_id: int) -> None:
        """Soft delete an Agent.

        Args:
            workspace_code: Workspace code
            agent_id: Agent ID

        Raises:
            BusinessException if validation fails
        """
        agent = self.get_agent(workspace_code, agent_id)

        # Check if has active tasks
        if self.agent_repo.has_active_tasks(agent_id):
            raise BusinessException(ERR_CONFLICT, "Cannot delete Agent with active tasks")

        self.agent_repo.soft_delete(agent)

    def enable_agent(self, workspace_code: str, agent_id: int) -> Agent:
        """Enable an Agent (from disabled or deleted status).

        Args:
            workspace_code: Workspace code
            agent_id: Agent ID

        Returns:
            Enabled Agent

        Raises:
            BusinessException if not allowed
        """
        agent = self.get_agent(workspace_code, agent_id)

        # Can enable from disabled or deleted status
        if agent.status not in [AgentStatus.DISABLED.value, AgentStatus.DELETED.value]:
            raise BusinessException(ERR_AGENT_STATUS_NOT_ALLOWED, "Only disabled or deleted Agents can be enabled")

        return self.agent_repo.update_status(agent, AgentStatus.ENABLED.value)

    def disable_agent(self, workspace_code: str, agent_id: int) -> Agent:
        """Disable an Agent.

        Args:
            workspace_code: Workspace code
            agent_id: Agent ID

        Returns:
            Disabled Agent

        Raises:
            BusinessException if not allowed
        """
        agent = self.get_agent(workspace_code, agent_id)

        # Can only disable enabled agents
        if agent.status != AgentStatus.ENABLED.value:
            raise BusinessException(ERR_AGENT_STATUS_NOT_ALLOWED, "Only enabled Agents can be disabled")

        return self.agent_repo.update_status(agent, AgentStatus.DISABLED.value)
