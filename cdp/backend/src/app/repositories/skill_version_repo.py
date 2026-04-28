"""Skill Version repository."""

from sqlalchemy.orm import Session

from app.models.skill_version import SkillVersion


class SkillVersionRepository:
    """SkillVersion data access repository."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, version: SkillVersion) -> SkillVersion:
        """Create a new skill version."""
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        return version

    def get_by_skill_and_version(self, skill_id: int, version: str) -> SkillVersion | None:
        """Get version by skill_id and version number."""
        return (
            self.db.query(SkillVersion)
            .filter(SkillVersion.skill_id == skill_id, SkillVersion.version == version)
            .first()
        )

    def get_versions_by_skill(self, skill_id: int) -> list[SkillVersion]:
        """Get all versions for a skill, ordered by created_at desc."""
        return (
            self.db.query(SkillVersion)
            .filter(SkillVersion.skill_id == skill_id)
            .order_by(SkillVersion.created_at.desc())
            .all()
        )

    def version_exists(self, skill_id: int, version: str) -> bool:
        """Check if a version already exists for this skill."""
        return (
            self.db.query(SkillVersion)
            .filter(SkillVersion.skill_id == skill_id, SkillVersion.version == version)
            .count()
            > 0
        )
