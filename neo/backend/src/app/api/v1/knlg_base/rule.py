"""Rule Library API endpoints: Rule CRUD + status + Evidence (READ-ONLY)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.knlg_base import (
    EvidenceListResponse,
    EvidenceResponse,
    RuleActivateResponse,
    RuleCreate,
    RuleDeprecateResponse,
    RuleListResponse,
    RulePauseResponse,
    RulePublishResponse,
    RuleResponse,
    RuleUpdate,
)
from app.schemas.response import ApiResponse
from app.services.knlg_base.rule import KnlgRuleService

router = APIRouter(prefix="/rules", tags=["knlg-base.rule"])


def get_service(db: Session = Depends(get_db)) -> KnlgRuleService:
    return KnlgRuleService(db)


@router.get("", response_model=ApiResponse[RuleListResponse])
def list_rules(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    source_kc_id: int | None = None,
    status: str | None = None,
    min_confidence: float | None = None,
    keyword: str | None = None,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_rules(
        workspace_code,
        current_user,
        page,
        page_size,
        source_kc_id,
        status,
        min_confidence,
        keyword,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return ApiResponse.success(
        RuleListResponse(
            items=[RuleResponse.model_validate(r) for r in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("", response_model=ApiResponse[RuleResponse])
def create_rule(
    workspace_code: str,
    data: RuleCreate,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    rule = service.create_rule(workspace_code, current_user, data.model_dump())
    return ApiResponse.success(RuleResponse.model_validate(rule))


@router.get("/{rule_id}", response_model=ApiResponse[RuleResponse])
def get_rule(
    workspace_code: str,
    rule_id: int,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    rule = service.get_rule(workspace_code, current_user, rule_id)
    return ApiResponse.success(RuleResponse.model_validate(rule))


@router.put("/{rule_id}", response_model=ApiResponse[RuleResponse])
def update_rule(
    workspace_code: str,
    rule_id: int,
    data: RuleUpdate,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    rule = service.update_rule(workspace_code, current_user, rule_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(RuleResponse.model_validate(rule))


@router.delete("/{rule_id}")
def delete_rule(
    workspace_code: str,
    rule_id: int,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    service.delete_rule(workspace_code, current_user, rule_id)
    return ApiResponse.success(None)


@router.post("/{rule_id}/publish", response_model=ApiResponse[RulePublishResponse])
def publish_rule(
    workspace_code: str,
    rule_id: int,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    rule = service.transition_rule(workspace_code, current_user, rule_id, "testing")
    return ApiResponse.success(RulePublishResponse.model_validate(rule))


@router.post("/{rule_id}/activate", response_model=ApiResponse[RuleActivateResponse])
def activate_rule(
    workspace_code: str,
    rule_id: int,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    rule = service.transition_rule(workspace_code, current_user, rule_id, "active")
    return ApiResponse.success(RuleActivateResponse.model_validate(rule))


@router.post("/{rule_id}/pause", response_model=ApiResponse[RulePauseResponse])
def pause_rule(
    workspace_code: str,
    rule_id: int,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    rule = service.transition_rule(workspace_code, current_user, rule_id, "paused")
    return ApiResponse.success(RulePauseResponse.model_validate(rule))


@router.post("/{rule_id}/deprecate", response_model=ApiResponse[RuleDeprecateResponse])
def deprecate_rule(
    workspace_code: str,
    rule_id: int,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    rule = service.transition_rule(workspace_code, current_user, rule_id, "deprecated")
    return ApiResponse.success(RuleDeprecateResponse.model_validate(rule))


# ==================== Evidence (READ-ONLY) ====================


@router.get("/{rule_id}/evidences", response_model=ApiResponse[EvidenceListResponse])
def list_evidences(
    workspace_code: str,
    rule_id: int,
    page: int = 1,
    page_size: int = 20,
    case_source: str | None = None,
    validator_type: str | None = None,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_evidences(
        workspace_code,
        current_user,
        rule_id,
        page,
        page_size,
        case_source,
        validator_type,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return ApiResponse.success(
        EvidenceListResponse(
            items=[EvidenceResponse.model_validate(e) for e in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.get("/{rule_id}/evidences/{evidence_id}", response_model=ApiResponse[EvidenceResponse])
def get_evidence(
    workspace_code: str,
    rule_id: int,
    evidence_id: int,
    service: KnlgRuleService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    evidence = service.get_evidence(workspace_code, current_user, rule_id, evidence_id)
    return ApiResponse.success(EvidenceResponse.model_validate(evidence))
