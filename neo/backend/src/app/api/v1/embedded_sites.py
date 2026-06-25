"""API routes for embedded sites."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories import workspace_repository
from app.repositories.embedded_site_repository import EmbeddedSiteRepository
from app.schemas.embedded_site import (
    EmbeddedSiteCreate,
    EmbeddedSiteListResponse,
    EmbeddedSiteResponse,
    EmbeddedSiteStatusResponse,
    EmbeddedSiteUpdate,
)
from app.schemas.response import ApiResponse

router = APIRouter(prefix="/workspaces/{workspace_code}/embedded-sites", tags=["embedded-sites"])


def _get_workspace_id(
    workspace_code: str,
    db: Session,
) -> int:
    """Get workspace ID by code, raise 404 if not found."""
    workspace = workspace_repository.get_workspace_by_code(db, workspace_code)

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # TODO: Check workspace membership
    return int(workspace.id)


@router.get("", response_model=ApiResponse[EmbeddedSiteListResponse])
def list_embedded_sites(
    workspace_code: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    site_status: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EmbeddedSiteListResponse:
    """List embedded sites for a workspace with pagination, filtering, and search."""
    workspace_id = _get_workspace_id(workspace_code, db)
    repo = EmbeddedSiteRepository(db)

    sites, total = repo.list_by_workspace(
        workspace_id=workspace_id,
        page=page,
        page_size=page_size,
        status=site_status,
        search=search,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        data=EmbeddedSiteListResponse(
            items=[EmbeddedSiteResponse.model_validate(site) for site in sites],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{site_id}", response_model=ApiResponse[EmbeddedSiteResponse])
def get_embedded_site(
    workspace_code: str,
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EmbeddedSiteResponse]:
    """Get a single embedded site by ID."""
    _get_workspace_id(workspace_code, db)
    repo = EmbeddedSiteRepository(db)

    site = repo.get_by_id(site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Embedded site not found",
        )

    return ApiResponse.success(data=EmbeddedSiteResponse.model_validate(site))


@router.post("", response_model=ApiResponse[EmbeddedSiteResponse], status_code=status.HTTP_201_CREATED)
def create_embedded_site(
    workspace_code: str,
    data: EmbeddedSiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EmbeddedSiteResponse]:
    """Create a new embedded site."""
    workspace_id = _get_workspace_id(workspace_code, db)
    repo = EmbeddedSiteRepository(db)

    # Check for duplicate name within workspace
    existing = repo.get_by_workspace_and_name(workspace_id, data.site_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Site name already exists in workspace",
        )

    site = repo.create(workspace_id=workspace_id, user_id=int(current_user.id), data=data)
    return ApiResponse.success(data=EmbeddedSiteResponse.model_validate(site))


@router.put("/{site_id}", response_model=ApiResponse[EmbeddedSiteResponse])
def update_embedded_site(
    workspace_code: str,
    site_id: int,
    data: EmbeddedSiteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EmbeddedSiteResponse]:
    """Update an existing embedded site."""
    _get_workspace_id(workspace_code, db)
    repo = EmbeddedSiteRepository(db)

    site = repo.get_by_id(site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Embedded site not found",
        )

    # Check for duplicate name if site_name is being updated
    if data.site_name and data.site_name != site.site_name:
        existing = repo.get_by_workspace_and_name(int(site.workspace_id), data.site_name, exclude_id=site_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Site name already exists in workspace",
            )

    updated_site = repo.update(site, data)
    return ApiResponse.success(data=EmbeddedSiteResponse.model_validate(updated_site))


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_embedded_site(
    workspace_code: str,
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an embedded site (soft delete)."""
    _get_workspace_id(workspace_code, db)
    repo = EmbeddedSiteRepository(db)

    site = repo.get_by_id(site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Embedded site not found",
        )

    # TODO: Check for linked agents before deletion
    # This check will be implemented when agent-embedded-site association is added

    repo.soft_delete(site)


@router.patch("/{site_id}/enable", response_model=ApiResponse[EmbeddedSiteStatusResponse])
def enable_embedded_site(
    workspace_code: str,
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EmbeddedSiteStatusResponse]:
    """Enable a disabled embedded site."""
    _get_workspace_id(workspace_code, db)
    repo = EmbeddedSiteRepository(db)

    site = repo.get_by_id(site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Embedded site not found",
        )

    enabled_site = repo.enable(site)
    return ApiResponse.success(
        data=EmbeddedSiteStatusResponse(
            id=int(enabled_site.id),
            status=enabled_site.status.value,
            updated_at=enabled_site.updated_at,
        ),
    )


@router.patch("/{site_id}/disable", response_model=ApiResponse[EmbeddedSiteStatusResponse])
def disable_embedded_site(
    workspace_code: str,
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EmbeddedSiteStatusResponse]:
    """Disable an enabled embedded site."""
    _get_workspace_id(workspace_code, db)
    repo = EmbeddedSiteRepository(db)

    site = repo.get_by_id(site_id)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Embedded site not found",
        )

    disabled_site = repo.disable(site)
    return ApiResponse.success(
        data=EmbeddedSiteStatusResponse(
            id=int(disabled_site.id),
            status=disabled_site.status.value,
            updated_at=disabled_site.updated_at,
        ),
    )
