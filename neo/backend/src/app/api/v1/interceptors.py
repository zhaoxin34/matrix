"""Interceptor API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories import workspace_repository
from app.repositories.interceptor_repository import InterceptorRepository
from app.schemas.interceptor import (
    InterceptorCreate,
    InterceptorListResponse,
    InterceptorResponse,
    InterceptorUpdate,
)
from app.schemas.response import ApiResponse

router = APIRouter(prefix="/interceptors", tags=["interceptors"])


def _get_workspace_and_repo(workspace_code: str, db: Session):
    """Get workspace and interceptor repository."""
    workspace = workspace_repository.get_workspace_by_code(db, workspace_code)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace, InterceptorRepository(db)


def _get_interceptor(workspace_id: int, interceptor_id: int, repo: InterceptorRepository):
    """Get interceptor or raise 404."""
    interceptor = repo.get_by_id(workspace_id, interceptor_id)
    if not interceptor:
        raise HTTPException(status_code=404, detail="Interceptor not found")
    return interceptor


def _to_response(interceptor) -> InterceptorResponse:
    """Convert interceptor model to response schema."""
    return InterceptorResponse.model_validate(interceptor)


def _check_site_exists(db: Session, site_id: int) -> None:
    """Check embedded site exists."""
    from app.repositories.embedded_site_repository import EmbeddedSiteRepository

    site_repo = EmbeddedSiteRepository(db)
    site = site_repo.get_by_id(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="EmbeddedSite not found")


@router.post("", response_model=ApiResponse[InterceptorResponse], status_code=status.HTTP_201_CREATED)
def create_interceptor(
    workspace_code: str,
    data: InterceptorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[InterceptorResponse]:
    """Create a new interceptor."""
    workspace, repo = _get_workspace_and_repo(workspace_code, db)
    _check_site_exists(db, data.embedded_site_id)

    mode_value = data.mode.value if hasattr(data.mode, "value") else data.mode
    interceptor = repo.create(
        data={
            "workspace_id": workspace.id,
            "embedded_site_id": data.embedded_site_id,
            "name": data.name,
            "event_name": data.event_name,
            "entity_name": data.entity_name,
            "target_entity_name": data.target_entity_name,
            "mode": mode_value,
            "trigger": data.trigger,
            "before_actions": data.before_actions,
            "after_actions": data.after_actions,
            "page_url_pattern": data.page_url_pattern,
            "debounce_ms": data.debounce_ms,
        },
        created_by=current_user.id,
    )
    db.commit()
    return ApiResponse.success(data=_to_response(interceptor))


@router.get("", response_model=ApiResponse[InterceptorListResponse])
def list_interceptors(
    workspace_code: str,
    embedded_site_id: int | None = Query(None, description="Filter by site ID"),
    status: str | None = Query(None, description="Filter by status"),
    name: str | None = Query(None, description="Search by name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[InterceptorListResponse]:
    """List interceptors."""
    workspace, repo = _get_workspace_and_repo(workspace_code, db)

    items, total = repo.list(
        workspace_id=workspace.id,
        embedded_site_id=embedded_site_id,
        status=status,
        name=name,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success(
        data=InterceptorListResponse(
            items=[_to_response(i) for i in items],
            total=total,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/{interceptor_id}", response_model=ApiResponse[InterceptorResponse])
def get_interceptor(
    workspace_code: str,
    interceptor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[InterceptorResponse]:
    """Get interceptor by ID."""
    workspace, repo = _get_workspace_and_repo(workspace_code, db)
    interceptor = _get_interceptor(workspace.id, interceptor_id, repo)
    return ApiResponse.success(data=_to_response(interceptor))


@router.put("/{interceptor_id}", response_model=ApiResponse[InterceptorResponse])
def update_interceptor(
    workspace_code: str,
    interceptor_id: int,
    data: InterceptorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[InterceptorResponse]:
    """Update an interceptor."""
    workspace, repo = _get_workspace_and_repo(workspace_code, db)
    interceptor = _get_interceptor(workspace.id, interceptor_id, repo)

    if data.embedded_site_id is not None:
        _check_site_exists(db, data.embedded_site_id)

    update_data = data.model_dump(exclude_unset=True)
    if "mode" in update_data and update_data["mode"]:
        mode = update_data["mode"]
        update_data["mode"] = mode.value if hasattr(mode, "value") else mode

    interceptor = repo.update(interceptor, update_data)
    db.commit()
    return ApiResponse.success(data=_to_response(interceptor))


@router.delete("/{interceptor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interceptor(
    workspace_code: str,
    interceptor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an interceptor (soft delete)."""
    workspace, repo = _get_workspace_and_repo(workspace_code, db)
    interceptor = _get_interceptor(workspace.id, interceptor_id, repo)
    repo.soft_delete(interceptor)
    db.commit()


def _toggle_status(
    workspace_code: str,
    interceptor_id: int,
    db: Session,
    enable: bool,
) -> ApiResponse[InterceptorResponse]:
    """Enable or disable an interceptor."""
    workspace, repo = _get_workspace_and_repo(workspace_code, db)
    interceptor = _get_interceptor(workspace.id, interceptor_id, repo)
    interceptor = repo.enable(interceptor) if enable else repo.disable(interceptor)
    db.commit()
    return ApiResponse.success(data=_to_response(interceptor))


@router.post("/{interceptor_id}/enable", response_model=ApiResponse[InterceptorResponse])
def enable_interceptor(
    workspace_code: str,
    interceptor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[InterceptorResponse]:
    """Enable an interceptor."""
    return _toggle_status(workspace_code, interceptor_id, db, enable=True)


@router.post("/{interceptor_id}/disable", response_model=ApiResponse[InterceptorResponse])
def disable_interceptor(
    workspace_code: str,
    interceptor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[InterceptorResponse]:
    """Disable an interceptor."""
    return _toggle_status(workspace_code, interceptor_id, db, enable=False)
