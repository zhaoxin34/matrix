"""Rule library repositories: Rule, Evidence."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.knlg_evidence import KnlgEvidence
from app.models.knlg_rule import KnlgRule


class KnlgRuleRepository:
    """Repository for rule operations."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, rule_id: int) -> KnlgRule | None:
        return (
            self.session.query(KnlgRule)
            .filter(
                KnlgRule.workspace_id == workspace_id,
                KnlgRule.id == rule_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgRule:
        rule = KnlgRule(**data)
        self.session.add(rule)
        self.session.flush()
        self.session.refresh(rule)
        return rule

    def update(self, rule: KnlgRule, data: dict[str, Any]) -> KnlgRule:
        mutable = {"name", "description", "trigger", "conditions", "conclusion", "exceptions", "confidence"}
        for key, value in data.items():
            if value is not None and key in mutable:
                setattr(rule, key, value)
        self.session.flush()
        self.session.refresh(rule)
        return rule

    def delete(self, rule: KnlgRule) -> None:
        self.session.delete(rule)
        self.session.flush()

    def transition_status(self, rule: KnlgRule, new_status: str) -> KnlgRule:
        rule.status = new_status
        if new_status == "active":
            from datetime import UTC, datetime

            rule.published_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(rule)
        return rule

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        source_kc_id: int | None = None,
        status: str | None = None,
        min_confidence: float | None = None,
        keyword: str | None = None,
    ) -> tuple[list[KnlgRule], int]:
        query = self.session.query(KnlgRule).filter(KnlgRule.workspace_id == workspace_id)
        if source_kc_id:
            query = query.filter(KnlgRule.source_kc_id == source_kc_id)
        if status:
            query = query.filter(KnlgRule.status == status)
        if min_confidence is not None:
            query = query.filter(KnlgRule.confidence >= min_confidence)
        if keyword:
            like = f"%{keyword}%"
            query = query.filter((KnlgRule.name.ilike(like)) | (KnlgRule.description.ilike(like)))
        query = query.order_by(KnlgRule.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total


class KnlgEvidenceRepository:
    """Repository for rule evidence (READ-ONLY in P0)."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, evidence_id: int) -> KnlgEvidence | None:
        return (
            self.session.query(KnlgEvidence)
            .filter(
                KnlgEvidence.workspace_id == workspace_id,
                KnlgEvidence.id == evidence_id,
            )
            .first()
        )

    def list_by_rule(
        self,
        workspace_id: int,
        rule_id: int,
        page: int = 1,
        page_size: int = 20,
        case_source: str | None = None,
        validator_type: str | None = None,
    ) -> tuple[list[KnlgEvidence], int]:
        query = self.session.query(KnlgEvidence).filter(
            KnlgEvidence.workspace_id == workspace_id,
            KnlgEvidence.rule_id == rule_id,
        )
        if case_source:
            query = query.filter(KnlgEvidence.case_source == case_source)
        if validator_type:
            query = query.filter(KnlgEvidence.validator_type == validator_type)
        query = query.order_by(KnlgEvidence.validated_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total
