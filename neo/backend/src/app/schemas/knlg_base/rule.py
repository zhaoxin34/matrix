"""Rule Library (knlg_rule, knlg_evidence) Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, Field

# ============ Rule CRUD ============


class RuleCreate(BaseModel):
    """Schema for creating a new Rule."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    source_kc_id: int = Field(..., description="Source knowledge card ID")
    scope: dict = Field(default_factory=dict, description="Applicable scope")
    trigger: dict = Field(
        ...,
        description="Trigger config (must have type=event_subscription, event_name)",
    )
    conditions: list[dict] = Field(
        default_factory=list,
        description="Array of condition objects {field, operator, value, combinator}",
    )
    conclusion: dict = Field(
        ...,
        description="Conclusion {action, message, priority, notify}",
    )
    exceptions: list[dict] | None = Field(None, description="Exception conditions")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)


class RuleUpdate(BaseModel):
    """Schema for updating a Rule (mutable fields only)."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=2000)
    trigger: dict | None = None
    conditions: list[dict] | None = None
    conclusion: dict | None = None
    exceptions: list[dict] | None = None
    confidence: float | None = Field(None, ge=0.0, le=1.0)


class RuleListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    source_kc_id: int | None = None
    status: str | None = None
    min_confidence: float | None = Field(None, ge=0.0, le=1.0)
    keyword: str | None = Field(None, max_length=200)


class RuleResponse(BaseModel):
    id: int
    name: str
    description: str | None
    source_kc_id: int
    scope: dict
    trigger: dict
    conditions: list[dict]
    conclusion: dict
    exceptions: list[dict] | None
    confidence: float
    version: str
    status: str
    execution_stats: dict | None
    published_at: datetime | None
    workspace_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RuleListResponse(BaseModel):
    items: list[RuleResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============ Status Transition Responses ============


class RulePublishResponse(BaseModel):
    """Response for publish operation (draft → testing)."""

    id: int
    status: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class RuleActivateResponse(BaseModel):
    """Response for activate operation (testing → active)."""

    id: int
    status: str
    published_at: datetime | None
    updated_at: datetime

    model_config = {"from_attributes": True}


class RulePauseResponse(BaseModel):
    """Response for pause operation (active → paused)."""

    id: int
    status: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class RuleDeprecateResponse(BaseModel):
    """Response for deprecate operation (any → deprecated)."""

    id: int
    status: str
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============ Evidence (READ-ONLY in P0) ============


class EvidenceListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    case_source: str | None = None
    validator_type: str | None = None


class EvidenceResponse(BaseModel):
    id: int
    rule_id: int
    case_source: str
    case_id: int
    case_data: dict | None
    outcome: str | None
    matched_rule: bool
    support_score: float
    validated_at: datetime
    validator_type: str
    workspace_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class EvidenceListResponse(BaseModel):
    items: list[EvidenceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
