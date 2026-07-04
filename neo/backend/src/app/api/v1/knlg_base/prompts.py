"""Phase 3 Prompt management REST endpoints.

Per spec prompt-management §"Prompt 编辑器 UI (Monaco)" — the editor calls:
  GET    /prompts               — list (filter by status / key)
  GET    /prompts/{id}          — read one
  POST   /prompts               — create draft
  PUT    /prompts/{id}          — update template (creates new version)
  POST   /prompts/render        — try-render with given variables
  POST   /prompts/{id}/activate — flip is_active flag (old → inactive)
  DELETE /prompts/{id}          — soft-delete (status → deprecated)

Spec task alignment: §5.1-5.4 (renderer + cache + invalidate) + §11 (editor).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.response import ApiResponse
from app.services.knlg_base.llm.prompt_renderer import (
    KnlgPromptRenderer,
    KnlgPromptRenderError,
)

router = APIRouter(prefix="/prompts", tags=["knlg-base.prompts"])


# ----------------------- Schemas -----------------------


class PromptCreatePayload(BaseModel):
    key: str = Field(..., min_length=1, max_length=128)
    name: str | None = Field(default=None, description="alias for `key`")
    template: str = Field(..., min_length=1)
    version: str = Field(default="1.0.0", max_length=32)
    description: str | None = None


class PromptUpdatePayload(BaseModel):
    template: str = Field(..., min_length=1)
    version: str | None = Field(default=None, max_length=32)
    description: str | None = None


class PromptResponse(BaseModel):
    id: int
    name: str
    version: str
    is_active: bool
    template: str
    description: str | None
    created_at: str | None = None
    updated_at: str | None = None


class RenderRequest(BaseModel):
    key: str = Field(..., description="prompt name (active version)")
    variables: dict[str, Any] = Field(default_factory=dict)
    version: str | None = None


class RenderResponse(BaseModel):
    rendered: str
    cached: bool
    key: str
    version: str


# ----------------------- Handlers -----------------------


def _to_response(p) -> PromptResponse:
    return PromptResponse(
        id=p.id,
        name=p.name,
        version=str(p.version),
        is_active=bool(p.is_active),
        template=p.template,
        description=p.description,
        created_at=p.created_at.isoformat() if p.created_at else None,
        updated_at=p.updated_at.isoformat() if getattr(p, "updated_at", None) else None,
    )


@router.get("", response_model=ApiResponse[list[PromptResponse]])
def list_prompts(
    workspace_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_active: bool | None = Query(default=None),
    key: str | None = Query(default=None),
    page: int = 1,
    page_size: int = 50,
):
    from app.models.knlg_llm_prompt import KnlgLlmPrompt

    q = db.query(KnlgLlmPrompt)
    if is_active is not None:
        q = q.filter(KnlgLlmPrompt.is_active == is_active)
    if key:
        q = q.filter(KnlgLlmPrompt.name == key)
    items = (
        q.order_by(KnlgLlmPrompt.name.asc(), KnlgLlmPrompt.version.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
        .all()
    )
    return ApiResponse.success([_to_response(p) for p in items])


@router.get("/{prompt_id}", response_model=ApiResponse[PromptResponse])
def get_prompt(
    workspace_code: str,
    prompt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    renderer = KnlgPromptRenderer(db)
    return ApiResponse.success(_to_response(renderer.get_prompt(prompt_id)))


@router.post("", response_model=ApiResponse[PromptResponse])
def create_prompt(
    workspace_code: str,
    payload: PromptCreatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.knlg_llm_prompt import KnlgLlmPrompt

    name = payload.key
    prompt = KnlgLlmPrompt(
        name=name,
        version=payload.version,
        is_active=True,
        template=payload.template,
        description=payload.description,
    )
    # Deactivate previous versions of the same name
    db.query(KnlgLlmPrompt).filter(
        KnlgLlmPrompt.name == name,
        KnlgLlmPrompt.is_active.is_(True),
    ).update({KnlgLlmPrompt.is_active: False})
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    # §5.3 — invalidate cached renders for this prompt name.
    KnlgPromptRenderer(db).invalidate(name)
    return ApiResponse.success(_to_response(prompt))


@router.put("/{prompt_id}", response_model=ApiResponse[PromptResponse])
def update_prompt(
    workspace_code: str,
    prompt_id: int,
    payload: PromptUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.knlg_llm_prompt import KnlgLlmPrompt

    prompt = db.query(KnlgLlmPrompt).filter(KnlgLlmPrompt.id == prompt_id).first()
    if not prompt:
        return ApiResponse.fail("Prompt not found")
    prompt.template = payload.template
    if payload.version:
        prompt.version = payload.version
        prompt.is_active = True
        # deactivate older versions
        db.query(KnlgLlmPrompt).filter(
            KnlgLlmPrompt.id != prompt_id,
            KnlgLlmPrompt.name == prompt.name,
            KnlgLlmPrompt.is_active.is_(True),
        ).update({KnlgLlmPrompt.is_active: False})
    if payload.description is not None:
        prompt.description = payload.description
    db.commit()
    db.refresh(prompt)
    # §5.3 cache invalidation
    KnlgPromptRenderer(db).invalidate(prompt.name)
    return ApiResponse.success(_to_response(prompt))


@router.post("/render", response_model=ApiResponse[RenderResponse])
def render_prompt_endpoint(
    workspace_code: str,
    payload: RenderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Try-render a prompt with the given variables. Caches results in Redis."""
    renderer = KnlgPromptRenderer(db)
    try:
        # Try cache first explicitly so we can flag `cached` on response.
        from app.services.knlg_base.llm.prompt_renderer import _cache_key

        if payload.version is None:
            prompt = renderer.get_active_prompt(payload.key)
            version = str(prompt.version)
        else:
            prompt = renderer._get_version(payload.key, payload.version)  # noqa: SLF001
            version = payload.version

        key = _cache_key(prompt.name, version, payload.variables)
        cached = False
        try:
            from app.core.cache import get_redis

            hit = get_redis().get(key)
            if hit:
                cached = True
                return ApiResponse.success(
                    RenderResponse(rendered=hit, cached=True, key=prompt.name, version=version),
                )
        except Exception:
            pass

        rendered = renderer.render(
            payload.key,
            payload.variables,
            version=payload.version,
            use_cache=True,
        )
        return ApiResponse.success(
            RenderResponse(rendered=rendered, cached=cached, key=prompt.name, version=version),
        )
    except KnlgPromptRenderError as exc:
        return ApiResponse.fail(exc.message or "Render failed", code=exc.code)
