"""Knowledge base repositories: KnowledgeCard, SourceRef, KnowledgeCardVersion."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.knlg_knowledge_card import KnlgKnowledgeCard
from app.models.knlg_knowledge_card_version import KnlgKnowledgeCardVersion
from app.models.knlg_source_ref import KnlgSourceRef


class KnlgKnowledgeCardRepository:
    """Repository for knowledge card operations."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, workspace_id: int, kc_id: int) -> KnlgKnowledgeCard | None:
        return (
            self.session.query(KnlgKnowledgeCard)
            .filter(
                KnlgKnowledgeCard.workspace_id == workspace_id,
                KnlgKnowledgeCard.id == kc_id,
            )
            .first()
        )

    def create(self, data: dict[str, Any]) -> KnlgKnowledgeCard:
        kc = KnlgKnowledgeCard(**data)
        self.session.add(kc)
        self.session.flush()
        self.session.refresh(kc)
        return kc

    def update(self, kc: KnlgKnowledgeCard, data: dict[str, Any]) -> KnlgKnowledgeCard:
        # Mutable fields only
        mutable = {
            "title",
            "statement",
            "domain",
            "tags",
            "type",
            "key_signals",
            "conditions",
            "exceptions",
            "confidence",
        }
        for key, value in data.items():
            if value is not None and key in mutable:
                setattr(kc, key, value)
        self.session.flush()
        self.session.refresh(kc)
        return kc

    def delete(self, kc: KnlgKnowledgeCard) -> None:
        self.session.delete(kc)
        self.session.flush()

    def list(
        self,
        workspace_id: int,
        page: int = 1,
        page_size: int = 20,
        domain: str | None = None,
        type_: str | None = None,
        status: str | None = None,
        validation_status: str | None = None,
        keyword: str | None = None,
    ) -> tuple[list[KnlgKnowledgeCard], int]:
        query = self.session.query(KnlgKnowledgeCard).filter(KnlgKnowledgeCard.workspace_id == workspace_id)
        if domain:
            query = query.filter(KnlgKnowledgeCard.domain == domain)
        if type_:
            query = query.filter(KnlgKnowledgeCard.type == type_)
        if status:
            query = query.filter(KnlgKnowledgeCard.status == status)
        if validation_status:
            query = query.filter(KnlgKnowledgeCard.validation_status == validation_status)
        if keyword:
            like = f"%{keyword}%"
            query = query.filter(
                (KnlgKnowledgeCard.title.ilike(like))
                | (KnlgKnowledgeCard.statement.ilike(like))
                | (KnlgKnowledgeCard.conditions.ilike(like))
                | (KnlgKnowledgeCard.exceptions.ilike(like))
            )
        query = query.order_by(KnlgKnowledgeCard.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total

    def transition_status(self, kc: KnlgKnowledgeCard, new_status: str) -> KnlgKnowledgeCard:
        """Transition status with validation enforced by service layer."""
        kc.status = new_status
        if new_status == "published":
            from datetime import UTC, datetime

            kc.published_at = datetime.now(UTC)
        self.session.flush()
        self.session.refresh(kc)
        return kc

    def count_by_workspace(self, workspace_id: int) -> int:
        return self.session.query(KnlgKnowledgeCard).filter(KnlgKnowledgeCard.workspace_id == workspace_id).count()


class KnlgSourceRefRepository:
    """Repository for knowledge card source references."""

    def __init__(self, session: Session):
        self.session = session

    def list_by_kc(self, workspace_id: int, kc_id: int) -> list[KnlgSourceRef]:
        return (
            self.session.query(KnlgSourceRef)
            .filter(
                KnlgSourceRef.workspace_id == workspace_id,
                KnlgSourceRef.kc_id == kc_id,
            )
            .order_by(KnlgSourceRef.created_at.desc())
            .all()
        )

    def bulk_create(self, source_refs: list[dict[str, Any]]) -> list[KnlgSourceRef]:
        """Bulk create source refs from a list of dicts."""
        entities = [KnlgSourceRef(**data) for data in source_refs]
        self.session.add_all(entities)
        self.session.flush()
        return entities


class KnlgKnowledgeCardVersionRepository:
    """Repository for knowledge card version history (READ-ONLY in P0)."""

    def __init__(self, session: Session):
        self.session = session

    def list_by_kc(
        self, workspace_id: int, kc_id: int, page: int = 1, page_size: int = 20
    ) -> tuple[list[KnlgKnowledgeCardVersion], int]:
        query = (
            self.session.query(KnlgKnowledgeCardVersion)
            .filter(
                KnlgKnowledgeCardVersion.workspace_id == workspace_id,
                KnlgKnowledgeCardVersion.kc_id == kc_id,
            )
            .order_by(KnlgKnowledgeCardVersion.created_at.desc())
        )
        total = query.count()
        items = query.offset((page - 1) * page_size).limit(page_size).all()
        return list(items), total
