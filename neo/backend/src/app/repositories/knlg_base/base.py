"""Base repository for knlg-base entities."""

from datetime import UTC, datetime
from typing import Any, Generic, TypeVar

from sqlalchemy.orm import Session

T = TypeVar("T")


class KnlgBaseRepository(Generic[T]):
    """Generic base repository for knlg-base entities.

    Provides common CRUD operations with workspace_id filtering.
    All list operations MUST be scoped to a workspace.
    """

    def __init__(self, session: Session, model_class: type[T]):
        self.session = session
        self.model = model_class

    def get_by_id(self, workspace_id: int, entity_id: int) -> T | None:
        """Get entity by ID within workspace scope."""
        return (
            self.session.query(self.model)
            .filter(
                self.model.workspace_id == workspace_id,
                self.model.id == entity_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> T:
        """Create a new entity."""
        entity = self.model(**data)
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def update(self, entity: T, data: dict[str, Any]) -> T:
        """Update entity with new data (only non-None values)."""
        for key, value in data.items():
            if value is not None:
                setattr(entity, key, value)
        # Update updated_at if model has it
        if hasattr(entity, "updated_at"):
            entity.updated_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        """Physical delete entity."""
        self.session.delete(entity)
        self.session.flush()

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        filters: dict[str, Any] | None = None,
        order_by=None,
    ) -> tuple[list[T], int]:
        """List entities with workspace scope and optional filters."""
        query = self.session.query(self.model).filter(self.model.workspace_id == workspace_id)

        # Apply filters
        if filters:
            for key, value in filters.items():
                if value is not None and hasattr(self.model, key):
                    column = getattr(self.model, key)
                    if isinstance(value, list):
                        query = query.filter(column.in_(value))
                    else:
                        query = query.filter(column == value)

        # Apply ordering
        if order_by is not None:
            query = query.order_by(order_by)
        elif hasattr(self.model, "created_at"):
            query = query.order_by(self.model.created_at.desc())

        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total
