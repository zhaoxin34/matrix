"""Skill business logic service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.skill import Skill, SkillLevel, SkillStatus
from app.repositories.skill_repo import SkillRepository
from app.schemas.skill import (
    SkillCreate,
    SkillListResponse,
    SkillResponse,
    SkillUpdate,
)


class SkillService:
    """Skill service."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = SkillRepository(db)

    def create_skill(self, data: SkillCreate) -> Skill:
        """Create a new skill with code uniqueness check."""
        existing = self.repo.get_by_code_or_none(data.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="code already exists",
            )
        skill = Skill(
            code=data.code,
            name=data.name,
            level=data.level,
            tags=data.tags,
            author=data.author,
            content=data.content,
        )
        return self.repo.create(skill)

    def get_skill(self, code: str) -> Skill:
        """Get skill by code."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        return skill

    def update_skill(self, code: str, data: SkillUpdate) -> Skill:
        """Update skill (code cannot be modified)."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

        if data.name is not None:
            skill.name = data.name
        if data.level is not None:
            skill.level = data.level
        if data.tags is not None:
            skill.tags = data.tags
        if data.author is not None:
            skill.author = data.author
        if data.content is not None:
            skill.content = data.content
            # If content is updated on a draft skill, activate it
            if skill.status == SkillStatus.draft:
                skill.status = SkillStatus.active

        return self.repo.update(skill)

    def delete_skill(self, code: str) -> None:
        """Soft delete skill."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        self.repo.soft_delete(skill)

    def activate_skill(self, code: str) -> Skill:
        """Activate skill."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        return self.repo.activate(skill)

    def deactivate_skill(self, code: str) -> Skill:
        """Deactivate skill."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        return self.repo.deactivate(skill)

    def list_skills(
        self,
        level: SkillLevel | None = None,
        tags: list[str] | None = None,
        status: SkillStatus | None = None,
        status_list: list[SkillStatus] | None = None,
        include_deleted: bool = False,
        keyword: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> SkillListResponse:
        """List skills with filters and pagination."""
        items, total = self.repo.list(
            level=level,
            tags=tags,
            status=status,
            status_list=status_list,
            include_deleted=include_deleted,
            keyword=keyword,
            page=page,
            page_size=page_size,
        )
        return SkillListResponse(
            items=[SkillResponse.model_validate(s) for s in items],
            total=total,
            page=page,
            page_size=page_size,
        )
