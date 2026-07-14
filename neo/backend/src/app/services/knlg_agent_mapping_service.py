"""Service for knlg_agent_mapping business logic.

Encapsulates business rules:
- Workspace existence (delegated to caller via workspace_id)
- Agent existence and workspace ownership
- (workspace_id, type) uniqueness
- type format validation (Pydantic covers this in API layer; we trust it here)

The repository only handles CRUD; this layer is where validation lives.
"""

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessException, ErrorCode
from app.models.agent import Agent, AgentStatus
from app.models.knlg_agent_mapping import KnlgAgentMapping
from app.repositories.knlg_agent_mapping_repository import KnlgAgentMappingRepository


class KnlgAgentMappingService:
    """Business logic for Agent Mapping (type -> agent) operations."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = KnlgAgentMappingRepository(db)

    # ---------- Reads ----------

    def list_mappings(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[KnlgAgentMapping], int]:
        """List mappings in a workspace (newest first)."""
        return self.repo.list_by_workspace(
            workspace_id=workspace_id,
            page=page,
            page_size=page_size,
        )

    def get_mapping(self, workspace_id: int, type: str) -> KnlgAgentMapping:
        """Get a single mapping or raise 404."""
        mapping = self.repo.get_by_workspace_and_type(workspace_id, type)
        if not mapping:
            raise BusinessException(
                ErrorCode.NOT_FOUND,
                f"Agent mapping for type '{type}' not found",
            )
        return mapping

    # ---------- Create ----------

    def create_mapping(
        self,
        workspace_id: int,
        type: str,
        agent_id: int,
    ) -> KnlgAgentMapping:
        """Create a new mapping.

        Validates:
        - Agent exists
        - Agent belongs to the same workspace
        - Agent is not deleted

        Raises:
            BusinessException(404): agent missing or cross-workspace
            BusinessException(409): (workspace_id, type) already exists
        """
        self._validate_agent_in_workspace(agent_id, workspace_id)

        try:
            mapping = self.repo.create(
                workspace_id=workspace_id,
                type=type,
                agent_id=agent_id,
            )
        except IntegrityError:
            # (workspace_id, type) UNIQUE violation
            raise BusinessException(
                ErrorCode.CONFLICT,
                f"Agent mapping for type '{type}' already exists in this workspace",
            ) from None

        self.db.commit()
        return mapping

    # ---------- Update ----------

    def update_mapping_agent(
        self,
        workspace_id: int,
        type: str,
        new_agent_id: int,
    ) -> KnlgAgentMapping:
        """Update the agent_id of an existing mapping.

        Raises:
            BusinessException(404): mapping not found, or new agent invalid
        """
        mapping = self.get_mapping(workspace_id, type)
        self._validate_agent_in_workspace(new_agent_id, workspace_id)

        updated = self.repo.update_agent_id(mapping, new_agent_id)
        self.db.commit()
        return updated

    # ---------- Delete ----------

    def delete_mapping(self, workspace_id: int, type: str) -> None:
        """Delete a mapping. Raises 404 if not found."""
        mapping = self.get_mapping(workspace_id, type)
        self.repo.delete(mapping)
        self.db.commit()

    # ---------- Internal helpers ----------

    def _validate_agent_in_workspace(self, agent_id: int, workspace_id: int) -> None:
        """Validate that the agent exists, belongs to workspace, and is not deleted.

        Raises BusinessException(404) on any failure (do not leak cross-workspace info).
        """
        agent = (
            self.db.query(Agent)
            .filter(
                Agent.id == agent_id,
                Agent.workspace_id == workspace_id,
                Agent.status != AgentStatus.DELETED.value,
            )
            .first()
        )
        if not agent:
            raise BusinessException(
                ErrorCode.NOT_FOUND,
                f"Agent {agent_id} not found in this workspace",
            )
