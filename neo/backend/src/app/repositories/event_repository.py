"""Repository for event CRUD operations."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate


class EventRepository:
    """Repository for event database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, event_id: int) -> Optional[Event]:
        """Get event by ID."""
        return self.db.query(Event).filter(Event.id == event_id).first()

    def list_by_workspace(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        name: Optional[str] = None,
        entity_name: Optional[str] = None,
        actor: Optional[str] = None,
        timestamp_start: Optional[datetime] = None,
        timestamp_end: Optional[datetime] = None,
        embedded_site_id: Optional[int] = None,
    ) -> tuple[list[Event], int]:
        """List events with pagination and filtering."""
        query = self.db.query(Event).filter(Event.workspace_id == workspace_id)

        # Filter by name (case-insensitive, partial match)
        if name:
            query = query.filter(Event.name.ilike(f"%{name}%"))

        # Filter by entity_name (exact match)
        if entity_name:
            query = query.filter(Event.entity_name == entity_name)

        # Filter by actor (case-insensitive, partial match)
        if actor:
            query = query.filter(Event.actor.ilike(f"%{actor}%"))

        # Filter by timestamp range
        if timestamp_start:
            query = query.filter(Event.timestamp >= timestamp_start)
        if timestamp_end:
            query = query.filter(Event.timestamp <= timestamp_end)

        # Filter by embedded_site_id
        if embedded_site_id:
            query = query.filter(Event.embedded_site_id == embedded_site_id)

        # Get total count
        total = query.count()

        # Apply pagination and sorting
        offset = (page - 1) * page_size
        items = query.order_by(Event.timestamp.desc()).offset(offset).limit(page_size).all()

        return items, total

    def create(self, workspace_id: int, user_id: int, data: EventCreate) -> Event:
        """Create a new event."""
        event = Event(
            name=data.name,
            entity_name=data.entity_name,
            target_entity_name=data.target_entity_name,
            actor=data.actor,
            timestamp=data.timestamp,
            page_url=data.page_url,
            session_id=data.session_id,
            event_metadata=data.metadata,
            workspace_id=workspace_id,
            created_by=user_id,
            embedded_site_id=data.embedded_site_id,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def update(self, event: Event, data: EventUpdate) -> Event:
        """Update an existing event."""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "metadata":
                setattr(event, "event_metadata", value)
            else:
                setattr(event, field, value)
        event.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(event)
        return event

    def hard_delete(self, event: Event) -> None:
        """Hard delete an event (permanent removal)."""
        self.db.delete(event)
        self.db.commit()
