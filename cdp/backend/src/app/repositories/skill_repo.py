"""Skill repository."""

from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.skill import Skill, SkillLevel


class SkillRepository:
    """Skill data access repository."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, skill: Skill) -> Skill:
        """Create a new skill."""
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        return skill

    def get_by_code(self, code: str) -> Skill | None:
        """Get skill by code (excludes soft-deleted)."""
        return self.db.query(Skill).filter(Skill.code == code, Skill.deleted_at.is_(None)).first()

    def get_by_code_or_none(self, code: str) -> Skill | None:
        """Get skill by code regardless of deleted status."""
        return self.db.query(Skill).filter(Skill.code == code).first()

    def update(self, skill: Skill) -> Skill:
        """Update an existing skill."""
        self.db.commit()
        self.db.refresh(skill)
        return skill

    def soft_delete(self, skill: Skill) -> None:
        """Soft delete a skill by setting deleted_at."""
        skill.deleted_at = datetime.utcnow()
        self.db.commit()

    def activate(self, skill: Skill) -> Skill:
        """Activate a skill."""
        skill.is_active = True
        self.db.commit()
        self.db.refresh(skill)
        return skill

    def deactivate(self, skill: Skill) -> Skill:
        """Deactivate a skill."""
        skill.is_active = False
        self.db.commit()
        self.db.refresh(skill)
        return skill

    def list(
        self,
        level: SkillLevel | None = None,
        tags: list[str] | None = None,
        is_active: bool | None = None,
        include_deleted: bool = False,
        keyword: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Skill], int]:
        """List skills with filters and pagination."""
        query = self.db.query(Skill)

        if not include_deleted:
            query = query.filter(Skill.deleted_at.is_(None))

        if level is not None:
            query = query.filter(Skill.level == level)

        if is_active is not None:
            query = query.filter(Skill.is_active == is_active)

        if tags:
            tag_filters = [Skill.tags.contains(tag) for tag in tags]
            query = query.filter(or_(*tag_filters))

        if keyword:
            search = f"%{keyword}%"
            query = query.filter(or_(Skill.code.ilike(search), Skill.name.ilike(search)))

        total = query.count()
        items = query.order_by(Skill.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total
