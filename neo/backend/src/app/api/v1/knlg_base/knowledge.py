"""Knowledge Base API endpoints."""

from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.knlg_base import (
    KnowledgeCardCreate,
    KnowledgeCardListResponse,
    KnowledgeCardResponse,
    KnowledgeCardUpdate,
    KnowledgeCardVersionResponse,
    SourceRefResponse,
)
from app.schemas.response import ApiResponse
from app.services.knlg_base.knowledge import KnlgKnowledgeCardService

router = APIRouter(prefix="/knowledge", tags=["knlg-base.knowledge"])


def get_service(db: Session = Depends(get_db)) -> KnlgKnowledgeCardService:
    return KnlgKnowledgeCardService(db)


@router.get("", response_model=ApiResponse[KnowledgeCardListResponse])
def list_cards(
    workspace_code: str = Path(..., description="Workspace code"),
    page: int = 1,
    page_size: int = 20,
    domain: str | None = None,
    type: str | None = None,
    status: str | None = None,
    validation_status: str | None = None,
    keyword: str | None = None,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    """List knowledge cards with filters."""
    items, total = service.list_cards(
        workspace_code,
        current_user,
        page,
        page_size,
        domain=domain,
        type_=type,
        status=status,
        validation_status=validation_status,
        keyword=keyword,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return ApiResponse.success(
        KnowledgeCardListResponse(
            items=[KnowledgeCardResponse.model_validate(c) for c in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.post("", response_model=ApiResponse[KnowledgeCardResponse])
def create_card(
    workspace_code: str,
    data: KnowledgeCardCreate,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    """Create a new knowledge card."""
    kc = service.create_card(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(KnowledgeCardResponse.model_validate(kc))


@router.get("/cards/{card_id}", response_model=ApiResponse[KnowledgeCardResponse])
def get_card(
    workspace_code: str,
    card_id: int,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    kc = service.get_card(workspace_code, current_user, card_id)
    return ApiResponse.success(KnowledgeCardResponse.model_validate(kc))


@router.put("/cards/{card_id}", response_model=ApiResponse[KnowledgeCardResponse])
def update_card(
    workspace_code: str,
    card_id: int,
    data: KnowledgeCardUpdate,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    kc = service.update_card(workspace_code, current_user, card_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(KnowledgeCardResponse.model_validate(kc))


@router.delete("/cards/{card_id}")
def delete_card(
    workspace_code: str,
    card_id: int,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    service.delete_card(workspace_code, current_user, card_id)
    return ApiResponse.success(None)


@router.post("/cards/{card_id}/publish", response_model=ApiResponse[KnowledgeCardResponse])
def publish_card(
    workspace_code: str,
    card_id: int,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    kc = service.transition_card(workspace_code, current_user, card_id, "published")
    return ApiResponse.success(KnowledgeCardResponse.model_validate(kc))


@router.post("/cards/{card_id}/deprecate", response_model=ApiResponse[KnowledgeCardResponse])
def deprecate_card(
    workspace_code: str,
    card_id: int,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    kc = service.transition_card(workspace_code, current_user, card_id, "deprecated")
    return ApiResponse.success(KnowledgeCardResponse.model_validate(kc))


@router.get("/cards/{card_id}/versions")
def list_versions(
    workspace_code: str,
    card_id: int,
    page: int = 1,
    page_size: int = 20,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    """List version history (READ-ONLY in P0)."""
    versions = service.list_versions(workspace_code, current_user, card_id)
    # Apply simple pagination in service
    start = (page - 1) * page_size
    end = start + page_size
    items = versions[start:end]
    total = len(versions)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    from app.schemas.knlg_base.knowledge import KnowledgeCardListResponse

    return ApiResponse.success(
        KnowledgeCardListResponse(
            items=[KnowledgeCardVersionResponse.model_validate(v) for v in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/cards/{card_id}/sources", response_model=ApiResponse[list[SourceRefResponse]])
def list_sources(
    workspace_code: str,
    card_id: int,
    service: KnlgKnowledgeCardService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    refs = service.list_source_refs(workspace_code, current_user, card_id)
    return ApiResponse.success([SourceRefResponse.model_validate(r) for r in refs])
