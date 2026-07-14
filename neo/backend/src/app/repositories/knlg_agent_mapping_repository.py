"""Repository for knlg_agent_mapping database operations.

Pure CRUD layer - no business rules. Business validation (agent existence,
workspace ownership, type format) lives in the service layer.
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
            IntegrityError: when (workspace_id, type) already exists (UNIQUE
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

    def get_by_id(self, mapping_id: int) -> KnlgAgentMapping | None:
        """Get a mapping by its primary key."""
        stmt = select(KnlgAgentMapping).where(KnlgAgentMapping.id == mapping_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_workspace_and_type(
        self,
        workspace_id: int,
        type: str,
    ) -> KnlgAgentMapping | None:
        """Get a mapping scoped by workspace and type."""
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
        """List mappings in a workspace, ordered by created_at DESC.

        Returns:
            Tuple of (mappings, total_count).
        """
        stmt = select(KnlgAgentMapping).where(
            KnlgAgentMapping.workspace_id == workspace_id,
        )

        # Count total first
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate
        stmt = stmt.order_by(KnlgAgentMapping.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        return list(result.scalars().all()), total

    # ---------- Update ----------

    def update_agent_id(
        self,
        mapping: KnlgAgentMapping,
        new_agent_id: int,
    ) -> KnlgAgentMapping:
        """Update the agent_id of an existing mapping in place."""
        mapping.agent_id = new_agent_id
        mapping.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(mapping)
        return mapping

    # ---------- Delete ----------

    def delete(self, mapping: KnlgAgentMapping) -> None:
        """Hard delete a mapping row."""
        self.db.delete(mapping)
        self.db.flush()
