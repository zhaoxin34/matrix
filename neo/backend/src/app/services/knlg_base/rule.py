"""Rule library service: CRUD + state machine + confidence validation."""

from sqlalchemy.orm import Session

from app.core.error_codes import ERR_CONFLICT, ERR_INVALID_PARAMETER, ERR_NOT_FOUND
from app.core.exceptions import BusinessException
from app.repositories.knlg_base.knowledge import KnlgKnowledgeCardRepository
from app.repositories.knlg_base.rule import KnlgEvidenceRepository, KnlgRuleRepository
from app.services.knlg_base.base import KnlgBaseService

# Valid status transitions for rules
VALID_RULE_TRANSITIONS = {
    "draft": {"testing", "deprecated"},
    "testing": {"active", "draft", "deprecated"},
    "active": {"paused", "deprecated"},
    "paused": {"active", "deprecated"},
    "deprecated": {"draft"},
}


class KnlgRuleService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgRuleRepository(db)
        self.evidence_repo = KnlgEvidenceRepository(db)
        self.kc_repo = KnlgKnowledgeCardRepository(db)

    def list_rules(
        self,
        workspace_code,
        user,
        page=1,
        page_size=20,
        source_kc_id=None,
        status=None,
        min_confidence=None,
        keyword=None,
    ):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.repo.list(
            ws_id,
            page,
            page_size,
            source_kc_id=source_kc_id,
            status=status,
            min_confidence=min_confidence,
            keyword=keyword,
        )

    def get_rule(self, workspace_code, user, rule_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        rule = self.repo.get_by_id(ws_id, rule_id)
        if not rule:
            raise BusinessException(ERR_NOT_FOUND, "Rule not found")
        return rule

    def create_rule(self, workspace_code, user, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        # Validate source_kc_id
        kc = self.kc_repo.get_by_id(ws_id, data["source_kc_id"])
        if not kc:
            raise BusinessException(ERR_INVALID_PARAMETER, "Source knowledge card not found in this workspace")
        # Validate trigger schema
        trigger = data.get("trigger", {})
        if trigger.get("type") != "event_subscription":
            raise BusinessException(ERR_INVALID_PARAMETER, "Trigger type must be 'event_subscription' in P0")
        if not trigger.get("event_name"):
            raise BusinessException(ERR_INVALID_PARAMETER, "Trigger must have 'event_name'")
        # Validate conditions
        for cond in data.get("conditions", []):
            valid_ops = {"==", "!=", ">", ">=", "<", "<=", "in", "not_in", "contains", "regex_match"}
            if cond.get("operator") not in valid_ops:
                raise BusinessException(ERR_INVALID_PARAMETER, f"Invalid operator: {cond.get('operator')}")
        # Validate conclusion
        conclusion = data.get("conclusion", {})
        if not any(k in conclusion for k in ("action", "message", "priority", "notify")):
            raise BusinessException(
                ERR_INVALID_PARAMETER, "Conclusion must have at least one of: action, message, priority, notify"
            )
        data.setdefault("workspace_id", ws_id)
        data.setdefault("created_by", user.id)
        data.setdefault("status", "draft")
        data.setdefault("version", "1.0")
        return self.repo.create(data)

    def update_rule(self, workspace_code, user, rule_id, data):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_write(user, ws_id)
        rule = self.repo.get_by_id(ws_id, rule_id)
        if not rule:
            raise BusinessException(ERR_NOT_FOUND, "Rule not found")
        return self.repo.update(rule, data)

    def delete_rule(self, workspace_code, user, rule_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        rule = self.repo.get_by_id(ws_id, rule_id)
        if not rule:
            raise BusinessException(ERR_NOT_FOUND, "Rule not found")
        self.repo.delete(rule)

    def transition_rule(self, workspace_code, user, rule_id, new_status):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, ws_id)
        rule = self.repo.get_by_id(ws_id, rule_id)
        if not rule:
            raise BusinessException(ERR_NOT_FOUND, "Rule not found")
        if new_status not in VALID_RULE_TRANSITIONS.get(rule.status, set()):
            raise BusinessException(
                ERR_CONFLICT,
                f"Invalid transition from {rule.status} to {new_status}",
            )
        if new_status == "active" and rule.confidence < 0.6:
            raise BusinessException(
                ERR_INVALID_PARAMETER,
                "Confidence must be >= 0.6 to activate",
            )
        return self.repo.transition_status(rule, new_status)

    def list_evidences(
        self,
        workspace_code,
        user,
        rule_id,
        page=1,
        page_size=20,
        case_source=None,
        validator_type=None,
    ):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        return self.evidence_repo.list_by_rule(
            ws_id,
            rule_id,
            page,
            page_size,
            case_source,
            validator_type,
        )

    def get_evidence(self, workspace_code, user, rule_id, evidence_id):
        ws_id = self._get_workspace_id(workspace_code)
        self._require_read(user, ws_id)
        evidence = self.evidence_repo.get_by_id(ws_id, evidence_id)
        if not evidence or evidence.rule_id != rule_id:
            raise BusinessException(ERR_NOT_FOUND, "Evidence not found")
        return evidence
