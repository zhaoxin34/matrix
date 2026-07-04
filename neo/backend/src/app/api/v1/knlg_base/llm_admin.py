"""Phase 3 LLM admin endpoints (provider / model CRUD).

Spec §4.4 — Phase 2 已有 LLM 表，本期新增 admin REST endpoints so that
non-engineers can manage providers/models via UI without DB access.
API key ciphertext is decrypted on read only when explicitly requested
(`?reveal=true`); defaults to masked.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.knlg_llm_model import KnlgLlmModel
from app.models.knlg_llm_provider import KnlgLlmProvider
from app.models.user import User
from app.schemas.response import ApiResponse
from app.services.knlg_base.llm.provider_cache import invalidate_provider

router = APIRouter(prefix="/llm-admin", tags=["knlg-base.llm-admin"])


# ----- Schemas -----


class ProviderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    display_name: str = Field(..., min_length=1, max_length=128)
    api_base_url: str | None = None
    api_key: str = Field(..., description="plaintext; encrypted on write")


class ProviderUpdate(BaseModel):
    display_name: str | None = None
    api_base_url: str | None = None
    api_key: str | None = None
    enabled: bool | None = None


class ProviderResponse(BaseModel):
    id: int
    name: str
    display_name: str
    api_base_url: str | None
    api_key_masked: str
    enabled: bool


class ModelCreate(BaseModel):
    provider_id: int
    name: str = Field(..., min_length=1, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=128)
    max_tokens: int = Field(default=4096, ge=1)
    cost_per_1k_input: float | None = None
    cost_per_1k_output: float | None = None
    capabilities: list[str] | None = None
    enabled: bool = True
    fallback_model_id: int | None = None


class ModelUpdate(BaseModel):
    display_name: str | None = None
    max_tokens: int | None = None
    cost_per_1k_input: float | None = None
    cost_per_1k_output: float | None = None
    capabilities: list[str] | None = None
    enabled: bool | None = None
    fallback_model_id: int | None = None


class ModelResponse(BaseModel):
    id: int
    provider_id: int
    name: str
    display_name: str
    max_tokens: int
    cost_per_1k_input: float | None
    cost_per_1k_output: float | None
    capabilities: list[str] | None
    enabled: bool
    fallback_model_id: int | None


# ----- Helpers -----


def _mask_key(ciphertext: str | None) -> str:
    if not ciphertext:
        return ""
    if ciphertext.startswith("fernet-v1:"):
        return ciphertext[:14] + "..."
    if len(ciphertext) <= 6:
        return "***"
    return ciphertext[:3] + "***" + ciphertext[-3:]


def _to_provider(p: KnlgLlmProvider, *, reveal: bool = False) -> ProviderResponse:
    raw = p.api_key_secret or ""
    if reveal:
        from app.core.crypto import get_api_key_cipher

        try:
            plaintext = get_api_key_cipher().decrypt(raw) if raw.startswith("fernet-v1:") else raw
        except Exception:
            plaintext = ""
        api_key_masked = plaintext or ""
    else:
        api_key_masked = _mask_key(raw)
    return ProviderResponse(
        id=p.id,
        name=p.name,
        display_name=p.display_name,
        api_base_url=p.api_base_url,
        api_key_masked=api_key_masked,
        enabled=p.enabled,
    )


def _to_model(m: KnlgLlmModel) -> ModelResponse:
    return ModelResponse(
        id=m.id,
        provider_id=m.provider_id,
        name=m.name,
        display_name=m.display_name,
        max_tokens=m.max_tokens,
        cost_per_1k_input=float(m.cost_per_1k_input) if m.cost_per_1k_input is not None else None,
        cost_per_1k_output=float(m.cost_per_1k_output) if m.cost_per_1k_output is not None else None,
        capabilities=list(m.capabilities or []),
        enabled=m.enabled,
        fallback_model_id=m.fallback_model_id,
    )


# ----- Providers -----


@router.get("/providers", response_model=ApiResponse[list[ProviderResponse]])
def list_providers(
    workspace_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    reveal: bool = Query(default=False),
):
    items = db.query(KnlgLlmProvider).order_by(KnlgLlmProvider.name.asc()).all()
    return ApiResponse.success([_to_provider(p, reveal=reveal) for p in items])


@router.post("/providers", response_model=ApiResponse[ProviderResponse])
def create_provider(
    workspace_code: str,
    payload: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.core.crypto import get_api_key_cipher

    ciphertext = get_api_key_cipher().encrypt(payload.api_key)
    p = KnlgLlmProvider(
        name=payload.name,
        display_name=payload.display_name,
        api_base_url=payload.api_base_url,
        api_key_secret=ciphertext,
        enabled=True,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    invalidate_provider(p.id)
    return ApiResponse.success(_to_provider(p))


@router.put("/providers/{provider_id}", response_model=ApiResponse[ProviderResponse])
def update_provider(
    workspace_code: str,
    provider_id: int,
    payload: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.core.crypto import get_api_key_cipher

    p = db.query(KnlgLlmProvider).filter(KnlgLlmProvider.id == provider_id).first()
    if not p:
        return ApiResponse.fail("Provider not found")
    if payload.display_name is not None:
        p.display_name = payload.display_name
    if payload.api_base_url is not None:
        p.api_base_url = payload.api_base_url
    if payload.api_key is not None:
        p.api_key_secret = get_api_key_cipher().encrypt(payload.api_key)
    if payload.enabled is not None:
        p.enabled = payload.enabled
    db.commit()
    db.refresh(p)
    invalidate_provider(p.id)
    return ApiResponse.success(_to_provider(p))


@router.delete("/providers/{provider_id}")
def delete_provider(
    workspace_code: str,
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = db.query(KnlgLlmProvider).filter(KnlgLlmProvider.id == provider_id).first()
    if not p:
        return ApiResponse.fail("Provider not found")
    db.delete(p)
    db.commit()
    invalidate_provider(provider_id)
    return ApiResponse.success({"deleted": provider_id})


# ----- Models -----


@router.get("/models", response_model=ApiResponse[list[ModelResponse]])
def list_models(
    workspace_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    provider_id: int | None = None,
):
    q = db.query(KnlgLlmModel)
    if provider_id is not None:
        q = q.filter(KnlgLlmModel.provider_id == provider_id)
    items = q.order_by(KnlgLlmModel.provider_id.asc(), KnlgLlmModel.name.asc()).all()
    return ApiResponse.success([_to_model(m) for m in items])


@router.post("/models", response_model=ApiResponse[ModelResponse])
def create_model(
    workspace_code: str,
    payload: ModelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    m = KnlgLlmModel(
        provider_id=payload.provider_id,
        name=payload.name,
        display_name=payload.display_name,
        max_tokens=payload.max_tokens,
        cost_per_1k_input=payload.cost_per_1k_input,
        cost_per_1k_output=payload.cost_per_1k_output,
        capabilities=payload.capabilities,
        enabled=payload.enabled,
        fallback_model_id=payload.fallback_model_id,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return ApiResponse.success(_to_model(m))


@router.put("/models/{model_id}", response_model=ApiResponse[ModelResponse])
def update_model(
    workspace_code: str,
    model_id: int,
    payload: ModelUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    m = db.query(KnlgLlmModel).filter(KnlgLlmModel.id == model_id).first()
    if not m:
        return ApiResponse.fail("Model not found")
    if payload.display_name is not None:
        m.display_name = payload.display_name
    if payload.max_tokens is not None:
        m.max_tokens = payload.max_tokens
    if payload.cost_per_1k_input is not None:
        m.cost_per_1k_input = payload.cost_per_1k_input
    if payload.cost_per_1k_output is not None:
        m.cost_per_1k_output = payload.cost_per_1k_output
    if payload.capabilities is not None:
        m.capabilities = payload.capabilities
    if payload.enabled is not None:
        m.enabled = payload.enabled
    if payload.fallback_model_id is not None:
        m.fallback_model_id = payload.fallback_model_id
    db.commit()
    db.refresh(m)
    return ApiResponse.success(_to_model(m))


@router.delete("/models/{model_id}")
def delete_model(
    workspace_code: str,
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    m = db.query(KnlgLlmModel).filter(KnlgLlmModel.id == model_id).first()
    if not m:
        return ApiResponse.fail("Model not found")
    db.delete(m)
    db.commit()
    return ApiResponse.success({"deleted": model_id})
