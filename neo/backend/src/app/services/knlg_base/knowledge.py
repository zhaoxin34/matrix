"""KnowledgeCard service: CRUD + state machine + source ref auto-creation."""

from typing import Any

from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_CONFLICT,
    ERR_NOT_FOUND,
)
from app.core.exceptions import BusinessException
from app.models.user import User
from app.repositories.knlg_base.knowledge import (
    KnlgKnowledgeCardRepository,
    KnlgKnowledgeCardVersionRepository,
    KnlgSourceRefRepository,
)
from app.services.knlg_base.base import KnlgBaseService

# Valid status transitions for knowledge cards
VALID_TRANSITIONS = {
    "draft": {"reviewing", "published", "deprecated"},
    "reviewing": {"published", "draft", "deprecated"},
    "published": {"deprecated"},
    "deprecated": {"draft"},
}


class KnlgKnowledgeCardService(KnlgBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.repo = KnlgKnowledgeCardRepository(db)
        self.source_ref_repo = KnlgSourceRefRepository(db)
        self.version_repo = KnlgKnowledgeCardVersionRepository(db)

    def list_cards(
        self,
        workspace_code: str,
        user: User,
        page: int = 1,
        page_size: int = 20,
        domain: str | None = None,
        type_: str | None = None,
        status: str | None = None,
        validation_status: str | None = None,
        keyword: str | None = None,
    ) -> tuple[list, int]:
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_read(user, workspace_id)
        return self.repo.list(
            workspace_id,
            page,
            page_size,
            domain=domain,
            type_=type_,
            status=status,
            validation_status=validation_status,
            keyword=keyword,
        )

    def get_card(self, workspace_code: str, user: User, kc_id: int):
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_read(user, workspace_id)
        kc = self.repo.get_by_id(workspace_id, kc_id)
        if not kc:
            raise BusinessException(ERR_NOT_FOUND, "Knowledge card not found")
        return kc

    def create_card(self, workspace_code: str, user: User, data: dict[str, Any]):
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_write(user, workspace_id)
        # Defaults
        data.setdefault("workspace_id", workspace_id)
        data.setdefault("created_by", user.id)
        data.setdefault("status", "draft")
        data.setdefault("version", "1.0")
        data.setdefault("validation_status", "pending_validation")
        data.setdefault("confidence", data.get("confidence", 0.5))
        kc = self.repo.create(data)

        # Auto-create source refs if source_turn_ids / source_doc_ids provided
        source_refs = []
        for turn_id in data.get("source_turn_ids") or []:
            source_refs.append(
                {
                    "kc_id": kc.id,
                    "source_type": "expert_interview",
                    "source_id": turn_id,
                    "workspace_id": workspace_id,
                    "contribution_weight": 1.0,
                }
            )
        for doc_id in data.get("source_doc_ids") or []:
            source_refs.append(
                {
                    "kc_id": kc.id,
                    "source_type": "document",
                    "source_id": doc_id,
                    "workspace_id": workspace_id,
                    "contribution_weight": 1.0,
                }
            )
        if source_refs:
            self.source_ref_repo.bulk_create(source_refs)
        return kc

    def update_card(self, workspace_code: str, user: User, kc_id: int, data: dict[str, Any]):
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_write(user, workspace_id)
        kc = self.repo.get_by_id(workspace_id, kc_id)
        if not kc:
            raise BusinessException(ERR_NOT_FOUND, "Knowledge card not found")
        return self.repo.update(kc, data)

    def delete_card(self, workspace_code: str, user: User, kc_id: int) -> None:
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, workspace_id)
        kc = self.repo.get_by_id(workspace_id, kc_id)
        if not kc:
            raise BusinessException(ERR_NOT_FOUND, "Knowledge card not found")
        self.repo.delete(kc)

    def transition_card(self, workspace_code: str, user: User, kc_id: int, new_status: str):
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_admin(user, workspace_id)
        kc = self.repo.get_by_id(workspace_id, kc_id)
        if not kc:
            raise BusinessException(ERR_NOT_FOUND, "Knowledge card not found")

        # Validate state transition
        if new_status not in VALID_TRANSITIONS.get(kc.status, set()):
            raise BusinessException(
                ERR_CONFLICT,
                f"Invalid transition from {kc.status} to {new_status}",
            )

        # Cannot publish if validation_status is pending_validation
        if new_status == "published" and kc.validation_status == "pending_validation":
            raise BusinessException(
                ERR_CONFLICT,
                "Cannot publish card with pending_validation status",
            )

        return self.repo.transition_status(kc, new_status)

    def list_versions(self, workspace_code: str, user: User, kc_id: int):
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_read(user, workspace_id)
        return self.version_repo.list_by_kc(workspace_id, kc_id)

    def list_source_refs(self, workspace_code: str, user: User, kc_id: int):
        workspace_id = self._get_workspace_id(workspace_code)
        self._require_read(user, workspace_id)
        return self.source_ref_repo.list_by_kc(workspace_id, kc_id)
