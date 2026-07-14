"""Repository for knlg_agent_mapping database operations.

Pure CRUD layer - no business rules. Business validation (agent existence,
workspace ownership, type format) lives in the service layer.

The natural primary key is (workspace_id, type); all lookups use that pair.
"""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.knlg_agent_mapping import KnlgAgentMapping


class KnlgAgentMappingRepository:
    """Repository for Agent Mapping (type -> agent) CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    # ---------- Create ----------

    def create(
        self,
        workspace_id: int,
        type: str,
        agent_id: int,
    ) -> KnlgAgentMapping:
        """Create a new mapping.

        Raises:
            IntegrityError: when (workspace_id, type) already exists (PK
                constraint violation). Callers should catch and translate to 409.
        """
        mapping = KnlgAgentMapping(
            workspace_id=workspace_id,
            type=type,
            agent_id=agent_id,
        )
        self.db.add(mapping)
        try:
            self.db.flush()
        except IntegrityError:
            # Rollback the failed flush so the session is usable again
            self.db.rollback()
            raise
        self.db.refresh(mapping)
        return mapping

    # ---------- Reads ----------

    def get_by_workspace_and_type(
        self,
        workspace_id: int,
        type: str,
    ) -> KnlgAgentMapping | None:
        """Get a mapping scoped by workspace and type (PK lookup)."""
        stmt = select(KnlgAgentMapping).where(
            KnlgAgentMapping.workspace_id == workspace_id,
            KnlgAgentMapping.type == type,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_workspace(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[KnlgAgentMapping], int]:
        """List mappings in a workspace, ordered by type ASC (stable order).

        Returns:
            Tuple of (mappings, total_count).
        """
        stmt = select(KnlgAgentMapping).where(
            KnlgAgentMapping.workspace_id == workspace_id,
        )

        # Count total first
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate, ordered by type ASC for deterministic display
        stmt = stmt.order_by(KnlgAgentMapping.type.asc()).offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        return list(result.scalars().all()), total

    # ---------- Update ----------

    def update_agent_id(
        self,
        workspace_id: int,
        type: str,
        new_agent_id: int,
    ) -> KnlgAgentMapping:
        """Update the agent_id of an existing mapping identified by (workspace_id, type).

        Caller is responsible for verifying existence; this method mutates and
        returns the row that was found.
        """
        mapping = self.get_by_workspace_and_type(workspace_id, type)
        if mapping is None:
            return None  # type: ignore[return-value]
        mapping.agent_id = new_agent_id
        mapping.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(mapping)
        return mapping

    # ---------- Delete ----------

    def delete(self, workspace_id: int, type: str) -> bool:
        """Delete a mapping by (workspace_id, type).

        Returns:
            True if a row was deleted, False if no mapping matched.
        """
        mapping = self.get_by_workspace_and_type(workspace_id, type)
        if mapping is None:
            return False
        self.db.delete(mapping)
        self.db.flush()
        return True
