"""Repository for embedded site CRUD operations."""

from datetime import UTC, datetime
from typing import Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.embedded_site import EmbeddedSite, EmbeddedSiteStatus
from app.schemas.embedded_site import EmbeddedSiteCreate, EmbeddedSiteUpdate


class EmbeddedSiteRepository:
    """Repository for embedded site database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, site_id: int, include_deleted: bool = False) -> Optional[EmbeddedSite]:
        """Get embedded site by ID."""
        query = self.db.query(EmbeddedSite).filter(EmbeddedSite.id == site_id)
        if not include_deleted:
            query = query.filter(EmbeddedSite.deleted_at.is_(None))
        return query.first()

    def get_by_workspace_and_name(
        self, workspace_id: int, site_name: str, exclude_id: Optional[int] = None
    ) -> Optional[EmbeddedSite]:
        """Check if site_name exists in workspace (for duplicate check)."""
        query = self.db.query(EmbeddedSite).filter(
            and_(
                EmbeddedSite.workspace_id == workspace_id,
                EmbeddedSite.site_name == site_name,
                EmbeddedSite.deleted_at.is_(None),
            )
        )
        if exclude_id:
            query = query.filter(EmbeddedSite.id != exclude_id)
        return query.first()

    def list_by_workspace(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> tuple[list[EmbeddedSite], int]:
        """List embedded sites with pagination, filtering, and search."""
        query = self.db.query(EmbeddedSite).filter(
            and_(
                EmbeddedSite.workspace_id == workspace_id,
                EmbeddedSite.deleted_at.is_(None),
            )
        )

        # Filter by status (case-insensitive)
        if status:
            status_upper = status.upper()
            query = query.filter(EmbeddedSite.status == status_upper)

        # Search by site_name or site_url
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    EmbeddedSite.site_name.ilike(search_pattern),
                    EmbeddedSite.site_url.ilike(search_pattern),
                )
            )

        # Get total count
        total = query.count()

        # Apply pagination
        offset = (page - 1) * page_size
        items = query.order_by(EmbeddedSite.created_at.desc()).offset(offset).limit(page_size).all()

        return items, total

    def create(self, workspace_id: int, user_id: int, data: EmbeddedSiteCreate) -> EmbeddedSite:
        """Create a new embedded site."""
        site = EmbeddedSite(
            site_name=data.site_name,
            site_url=data.site_url,
            description=data.description,
            workspace_id=workspace_id,
            status=EmbeddedSiteStatus.DISABLED,
            created_by=user_id,
        )
        self.db.add(site)
        self.db.commit()
        self.db.refresh(site)
        return site

    def update(self, site: EmbeddedSite, data: EmbeddedSiteUpdate) -> EmbeddedSite:
        """Update an existing embedded site."""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(site, field, value)
        site.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(site)
        return site

    def soft_delete(self, site: EmbeddedSite) -> None:
        """Soft delete an embedded site."""
        site.deleted_at = datetime.now(UTC)
        self.db.commit()

    def enable(self, site: EmbeddedSite) -> EmbeddedSite:
        """Enable an embedded site."""
        site.status = EmbeddedSiteStatus.ENABLED
        site.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(site)
        return site

    def disable(self, site: EmbeddedSite) -> EmbeddedSite:
        """Disable an embedded site."""
        site.status = EmbeddedSiteStatus.DISABLED
        site.updated_at = datetime.now(UTC)
        self.db.commit()
        self.db.refresh(site)
        return site
