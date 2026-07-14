"""Service for knlg_agent_mapping business logic.

Encapsulates business rules:
- Agent existence and workspace ownership
- (workspace_id, type) uniqueness (enforced by PK at the DB layer; we
  catch IntegrityError and translate to 409 for nice error messages)
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
        """List mappings in a workspace (ordered by type ASC)."""
        return self.repo.list_by_workspace(
            workspace_id=workspace_id,
            page=page,
            page_size=page_size,
        )

    def get_mapping(self, workspace_id: int, type: str) -> KnlgAgentMapping:
        """Get a single mapping or raise 404."""
        type_str = type.value if hasattr(type, "value") else str(type)
        mapping = self.repo.get_by_workspace_and_type(workspace_id, type_str)
        if not mapping:
            raise BusinessException(
                ErrorCode.NOT_FOUND,
                f"Agent mapping for type '{type_str}' not found",
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
        - Agent exists in the same workspace and is not deleted
        - (workspace_id, type) not already used (PK uniqueness)

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
            # (workspace_id, type) PK violation
            type_str = type.value if hasattr(type, "value") else str(type)
            raise BusinessException(
                ErrorCode.CONFLICT,
                f"Agent mapping for type '{type_str}' already exists in this workspace",
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
        # Normalize enum to its string value for repo calls
        type_str = type.value if hasattr(type, "value") else str(type)

        # Ensure mapping exists first (for a clean 404 before the agent check)
        self.get_mapping(workspace_id, type_str)

        self._validate_agent_in_workspace(new_agent_id, workspace_id)

        updated = self.repo.update_agent_id(workspace_id, type_str, new_agent_id)
        self.db.commit()
        return updated

    # ---------- Delete ----------

    def delete_mapping(self, workspace_id: int, type: str) -> None:
        """Delete a mapping. Raises 404 if not found."""
        type_str = type.value if hasattr(type, "value") else str(type)
        # Ensure mapping exists first for a clean 404
        self.get_mapping(workspace_id, type_str)

        deleted = self.repo.delete(workspace_id, type_str)
        if not deleted:
            raise BusinessException(
                ErrorCode.NOT_FOUND,
                f"Agent mapping for type '{type_str}' not found",
            )
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
