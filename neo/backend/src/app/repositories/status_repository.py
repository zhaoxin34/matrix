"""Repository for status CRUD operations."""

from datetime import datetime

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.status import Status
from app.schemas.status import StatusCreate, StatusUpdate


class StatusRepository:
    """Repository for status database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, status_id: int) -> Status | None:
        """Get status by ID."""
        return self.db.query(Status).filter(Status.id == status_id).first()

    def get_by_entity_and_time(
        self,
        entity_type: str,
        entity_id: str,
        stat_at: datetime,
        exclude_id: int | None = None,
    ) -> Status | None:
        """Check if status with same entity_type + entity_id + stat_at exists."""
        query = self.db.query(Status).filter(
            and_(
                Status.entity_type == entity_type,
                Status.entity_id == entity_id,
                Status.stat_at == stat_at,
            ),
        )
        if exclude_id:
            query = query.filter(Status.id != exclude_id)
        return query.first()

    def list_by_workspace(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        entity_type: str | None = None,
        entity_id: str | None = None,
        stat_start: datetime | None = None,
        stat_end: datetime | None = None,
        source: str | None = None,
    ) -> tuple[list[Status], int]:
        """List status records with pagination and filtering."""
        query = self.db.query(Status).filter(Status.workspace_id == workspace_id)

        # Filter by entity_type (exact match)
        if entity_type:
            query = query.filter(Status.entity_type == entity_type)

        # Filter by entity_id (exact match)
        if entity_id:
            query = query.filter(Status.entity_id == entity_id)

        # Filter by stat_at range
        if stat_start:
            query = query.filter(Status.stat_at >= stat_start)
        if stat_end:
            query = query.filter(Status.stat_at <= stat_end)

        # Filter by source (exact match)
        if source:
            query = query.filter(Status.source == source)

        # Get total count
        total = query.count()

        # Apply pagination and sorting
        offset = (page - 1) * page_size
        items = query.order_by(Status.stat_at.desc()).offset(offset).limit(page_size).all()

        return items, total

    def create(self, workspace_id: int, user_id: int, data: StatusCreate) -> Status:
        """Create a new status record."""
        status = Status(
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            attributes=data.attributes,
            stat_at=data.stat_at,
            source=data.source,
            session_id=data.session_id,
            workspace_id=workspace_id,
            created_by=user_id,
        )
        self.db.add(status)
        self.db.commit()
        self.db.refresh(status)
        return status

    def update(self, status: Status, data: StatusUpdate) -> Status:
        """Update an existing status record."""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(status, field, value)
        status.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(status)
        return status

    def hard_delete(self, status: Status) -> None:
        """Hard delete a status record (permanent removal)."""
        self.db.delete(status)
        self.db.commit()
