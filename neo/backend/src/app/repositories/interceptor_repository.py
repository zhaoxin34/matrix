"""Interceptor repository."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.interceptor import Interceptor


class InterceptorRepository:
    """Repository for interceptor operations."""

    def __init__(self, session: Session):
        self.session = session

    def create(self, data: dict[str, Any], created_by: int) -> Interceptor:
        """Create a new interceptor."""
        trigger = data.get("trigger", {})
        trigger_type = trigger.get("type") if isinstance(trigger, dict) else None

        interceptor = Interceptor(
            workspace_id=data["workspace_id"],
            embedded_site_id=data["embedded_site_id"],
            name=data["name"],
            event_name=data["event_name"],
            mode=data.get("mode", "observe"),
            entity_name=data["entity_name"],
            target_entity_name=data.get("target_entity_name"),
            trigger_type=trigger_type,
            trigger=data["trigger"],
            before_actions=data.get("before_actions") or [],
            after_actions=data.get("after_actions") or [],
            page_url_pattern=data.get("page_url_pattern"),
            debounce_ms=data.get("debounce_ms", 1000),
            status="ENABLED",
            created_by=created_by,
        )
        self.session.add(interceptor)
        self.session.flush()
        self.session.refresh(interceptor)
        return interceptor

    def get_by_id(self, workspace_id: int, interceptor_id: int) -> Interceptor | None:
        """Get interceptor by ID."""
        return (
            self.session.query(Interceptor)
            .filter(
                Interceptor.workspace_id == workspace_id,
                Interceptor.id == interceptor_id,
            )
            .first()
        )

    def list(
        self,
        workspace_id: int,
        embedded_site_id: int | None = None,
        status: str | None = None,
        name: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Interceptor], int]:
        """List interceptors with filters."""
        query = self.session.query(Interceptor).filter(Interceptor.workspace_id == workspace_id)

        if embedded_site_id is not None:
            query = query.filter(Interceptor.embedded_site_id == embedded_site_id)
        if status is not None:
            query = query.filter(Interceptor.status == status)
        if name:
            query = query.filter(Interceptor.name.ilike(f"%{name}%"))

        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()

        return list(items), total

    def update(self, interceptor: Interceptor, data: dict[str, Any]) -> Interceptor:
        """Update an interceptor."""
        # Sync trigger_type from trigger
        if "trigger" in data and data["trigger"]:
            trigger = data["trigger"]
            if isinstance(trigger, dict) and "type" in trigger:
                interceptor.trigger_type = trigger["type"]

        # Update fields
        for key, value in data.items():
            if value is not None and key != "workspace_id":
                setattr(interceptor, key, value)

        interceptor.updated_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(interceptor)
        return interceptor

    def _set_status(self, interceptor: Interceptor, status: str) -> Interceptor:
        """Set interceptor status."""
        interceptor.status = status
        interceptor.updated_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(interceptor)
        return interceptor

    def soft_delete(self, interceptor: Interceptor) -> None:
        """Soft delete an interceptor."""
        self._set_status(interceptor, "DISABLED")

    def enable(self, interceptor: Interceptor) -> Interceptor:
        """Enable an interceptor."""
        return self._set_status(interceptor, "ENABLED")

    def disable(self, interceptor: Interceptor) -> Interceptor:
        """Disable an interceptor."""
        return self._set_status(interceptor, "DISABLED")
