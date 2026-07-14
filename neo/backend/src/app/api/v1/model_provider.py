"""Model Provider API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.model_config import ModelConfigCreate, ModelConfigResponse, ModelConfigUpdate
from app.schemas.model_provider import (
    ModelProviderCreate,
    ModelProviderListResponse,
    ModelProviderResponse,
    ModelProviderStatusResponse,
    ModelProviderUpdate,
)
from app.schemas.response import ApiResponse
from app.services.model_provider_service import ModelProviderService

router = APIRouter(prefix="/model-providers", tags=["Model Provider"])


def get_service(db: Session = Depends(get_db)) -> ModelProviderService:
    """Get Model Provider service."""
    return ModelProviderService(db)


@router.get("", response_model=ApiResponse[ModelProviderListResponse])
def list_providers(
    service: ModelProviderService = Depends(get_service),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    enabled: bool | None = Query(None, description="Filter by enabled status"),
    for_agent: bool = Query(False, description="Filter for agent creation"),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelProviderListResponse]:
    """List all Model Providers with pagination and filters."""
    providers, total = service.list_providers(
        enabled=enabled,
        for_agent=for_agent,
        page=page,
        page_size=page_size,
    )

    return ApiResponse.success(
        ModelProviderListResponse(
            items=[ModelProviderResponse.model_validate(p) for p in providers],
            total=total,
            page=page,
            page_size=page_size,
        ),
    )


@router.post("", response_model=ApiResponse[ModelProviderResponse])
def create_provider(
    data: ModelProviderCreate,
    service: ModelProviderService = Depends(get_service),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelProviderResponse]:
    """Create a new Model Provider."""
    provider = service.create_provider(data, user_id=int(current_user.id))
    return ApiResponse.success(ModelProviderResponse.model_validate(provider))


@router.get("/{provider_id}", response_model=ApiResponse[ModelProviderResponse])
def get_provider(
    provider_id: int,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelProviderResponse]:
    """Get a Model Provider by ID."""
    provider = service.get_provider(provider_id)
    return ApiResponse.success(ModelProviderResponse.model_validate(provider))


@router.put("/{provider_id}", response_model=ApiResponse[ModelProviderResponse])
def update_provider(
    provider_id: int,
    data: ModelProviderUpdate,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelProviderResponse]:
    """Update a Model Provider."""
    provider = service.update_provider(provider_id, data)
    return ApiResponse.success(ModelProviderResponse.model_validate(provider))


@router.delete("/{provider_id}", response_model=ApiResponse[dict])
def delete_provider(
    provider_id: int,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Delete a Model Provider (cascade deletes models)."""
    service.delete_provider(provider_id)
    return ApiResponse.success({"message": "Provider deleted successfully"})


@router.patch("/{provider_id}/enable", response_model=ApiResponse[ModelProviderStatusResponse])
def enable_provider(
    provider_id: int,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelProviderStatusResponse]:
    """Enable a Model Provider."""
    provider = service.enable_provider(provider_id)
    return ApiResponse.success(
        ModelProviderStatusResponse(
            id=provider.id,
            enabled=provider.enabled,
            updated_at=provider.updated_at,
        ),
    )


@router.patch("/{provider_id}/disable", response_model=ApiResponse[ModelProviderStatusResponse])
def disable_provider(
    provider_id: int,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelProviderStatusResponse]:
    """Disable a Model Provider."""
    provider = service.disable_provider(provider_id)
    return ApiResponse.success(
        ModelProviderStatusResponse(
            id=provider.id,
            enabled=provider.enabled,
            updated_at=provider.updated_at,
        ),
    )


# ============ Model Config Endpoints ============


@router.get("/{provider_id}/models", response_model=ApiResponse[list[ModelConfigResponse]])
def list_models(
    provider_id: int,
    service: ModelProviderService = Depends(get_service),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    enabled: bool | None = Query(None, description="Filter by enabled status"),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[list[ModelConfigResponse]]:
    """List all Model Configs under a provider."""
    models, total = service.list_models(
        provider_id=provider_id,
        enabled=enabled,
        page=page,
        page_size=page_size,
    )

    # Return list without pagination wrapper for simplicity
    return ApiResponse.success([ModelConfigResponse.model_validate(m) for m in models])


@router.post("/{provider_id}/models", response_model=ApiResponse[ModelConfigResponse])
def create_model(
    provider_id: int,
    data: ModelConfigCreate,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelConfigResponse]:
    """Create a new Model Config under a provider."""
    config = service.create_model_config(provider_id, data)
    return ApiResponse.success(ModelConfigResponse.model_validate(config))


@router.get("/{provider_id}/models/{model_id}", response_model=ApiResponse[ModelConfigResponse])
def get_model(
    provider_id: int,
    model_id: str,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelConfigResponse]:
    """Get a Model Config by ID."""
    config = service.get_model_config(provider_id, model_id)
    return ApiResponse.success(ModelConfigResponse.model_validate(config))


@router.put("/{provider_id}/models/{model_id}", response_model=ApiResponse[ModelConfigResponse])
def update_model(
    provider_id: int,
    model_id: str,
    data: ModelConfigUpdate,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[ModelConfigResponse]:
    """Update a Model Config."""
    config = service.update_model_config(provider_id, model_id, data)
    return ApiResponse.success(ModelConfigResponse.model_validate(config))


@router.delete("/{provider_id}/models/{model_id}", response_model=ApiResponse[dict])
def delete_model(
    provider_id: int,
    model_id: str,
    service: ModelProviderService = Depends(get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Delete a Model Config."""
    service.delete_model_config(provider_id, model_id)
    return ApiResponse.success({"message": "Model deleted successfully"})
