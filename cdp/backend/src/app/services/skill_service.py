"""Skill business logic service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.skill import Skill, SkillLevel, SkillStatus
from app.models.skill_version import SkillVersion
from app.repositories.skill_repo import SkillRepository
from app.repositories.skill_version_repo import SkillVersionRepository
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
        self.version_repo = SkillVersionRepository(db)

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

    def publish_skill(self, code: str, version: str, comment: str) -> Skill:
        """Publish skill: save content to version history and set status to active."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

        # Check version uniqueness
        if self.version_repo.version_exists(skill.id, version):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"version {version} already exists",
            )

        # Create version record
        skill_version = SkillVersion(
            skill_id=skill.id,
            version=version,
            content=skill.content,
            comment=comment,
        )
        self.version_repo.create(skill_version)

        # Update skill
        skill.version = version
        skill.status = SkillStatus.active
        return self.repo.update(skill)

    def get_skill_versions(self, code: str) -> list[SkillVersion]:
        """Get all published versions for a skill."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
        return self.version_repo.get_versions_by_skill(skill.id)

    def rollback_skill(self, code: str, version: str) -> Skill:
        """Rollback skill to a specific version."""
        skill = self.repo.get_by_code(code)
        if not skill:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

        # Find the version record
        skill_version = self.version_repo.get_by_skill_and_version(skill.id, version)
        if not skill_version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"version {version} not found",
            )

        # Rollback: copy content and version
        skill.content = skill_version.content
        skill.version = skill_version.version
        return self.repo.update(skill)

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
