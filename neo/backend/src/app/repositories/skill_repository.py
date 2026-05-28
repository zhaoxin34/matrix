"""Skill repository for database operations."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.file import File
from app.models.file_metadata import FileMetadata
from app.models.skill import Skill, SkillLevel, SkillStatus
from app.models.skill_version import SkillVersion


class SkillRepository:
    """Repository for Skill database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, skill: Skill) -> Skill:
        """Create a new Skill."""
        self.db.add(skill)
        self.db.flush()
        self.db.refresh(skill)
        return skill

    def get_by_code(self, code: str) -> Skill | None:
        """Get a Skill by code."""
        stmt = select(Skill).where(Skill.code == code, Skill.deleted_at.is_(None))
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_by_code_with_versions(self, code: str) -> Skill | None:
        """Get a Skill by code with versions loaded."""
        stmt = select(Skill).where(Skill.code == code, Skill.deleted_at.is_(None))
        result = self.db.execute(stmt)
        skill = result.scalar_one_or_none()
        if skill:
            # Load versions relationship
            versions = (
                self.db.query(SkillVersion)
                .filter(SkillVersion.skill_id == skill.id)
                .order_by(SkillVersion.created_at.desc())
                .all()
            )
            skill.versions = versions
        return skill

    def list_skills(
        self,
        status: SkillStatus | None = None,
        level: SkillLevel | None = None,
        tags: list[str] | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Skill], int]:
        """List skills with filters and pagination."""
        stmt = select(Skill).where(Skill.deleted_at.is_(None))

        if status:
            stmt = stmt.where(Skill.status == status)
        if level:
            stmt = stmt.where(Skill.level == level)
        if search:
            stmt = stmt.where((Skill.name.ilike(f"%{search}%")) | (Skill.code.ilike(f"%{search}%")))

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar_one()

        # Paginate
        stmt = stmt.order_by(Skill.created_at.desc())
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        result = self.db.execute(stmt)
        skills = list(result.scalars().all())

        return skills, total

    def update(self, skill: Skill) -> Skill:
        """Update a Skill."""
        skill.updated_at = datetime.now(UTC)
        self.db.flush()
        self.db.refresh(skill)
        return skill

    def delete(self, skill: Skill) -> None:
        """Soft delete a Skill."""
        skill.deleted_at = datetime.now(UTC)
        self.db.flush()

    def update_draft_snapshot(self, skill: Skill, snapshot: list[dict]) -> None:
        """Update the draft snapshot of a Skill."""
        skill.draft_snapshot = snapshot
        skill.updated_at = datetime.now(UTC)
        self.db.flush()


class SkillVersionRepository:
    """Repository for SkillVersion database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, version: SkillVersion) -> SkillVersion:
        """Create a new SkillVersion."""
        self.db.add(version)
        self.db.flush()
        self.db.refresh(version)
        return version

    def get_versions_by_skill(self, skill_id: int) -> list[SkillVersion]:
        """Get all versions for a skill."""
        return (
            self.db.query(SkillVersion)
            .filter(SkillVersion.skill_id == skill_id)
            .order_by(SkillVersion.created_at.desc())
            .all()
        )

    def get_by_version(self, skill_id: int, version: str) -> SkillVersion | None:
        """Get a specific version."""
        return (
            self.db.query(SkillVersion)
            .filter(
                SkillVersion.skill_id == skill_id,
                SkillVersion.version == version,
            )
            .first()
        )


class FileMetadataRepository:
    """Repository for FileMetadata database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, file_metadata: FileMetadata) -> FileMetadata:
        """Create a new FileMetadata."""
        self.db.add(file_metadata)
        self.db.flush()
        self.db.refresh(file_metadata)
        return file_metadata

    def get_by_path(self, path: str) -> FileMetadata | None:
        """Get file metadata by path."""
        return self.db.query(FileMetadata).filter(FileMetadata.path == path).first()

    def get_by_skill(self, skill_id: int) -> list[FileMetadata]:
        """Get all file metadata for a skill."""
        return self.db.query(FileMetadata).filter(FileMetadata.skill_id == skill_id).all()

    def delete(self, file_metadata: FileMetadata) -> None:
        """Delete file metadata."""
        self.db.delete(file_metadata)
        self.db.flush()


class FileRepository:
    """Repository for File database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, file: File) -> File:
        """Create a new File."""
        self.db.add(file)
        self.db.flush()
        self.db.refresh(file)
        return file

    def get_latest_version(self, file_metadata_id: int) -> File | None:
        """Get the latest version of a file."""
        return (
            self.db.query(File).filter(File.file_metadata_id == file_metadata_id).order_by(File.version.desc()).first()
        )

    def create_new_version(self, file_metadata_id: int, content: str) -> File:
        """Create a new version of a file."""
        latest = self.get_latest_version(file_metadata_id)
        new_version = File(
            file_metadata_id=file_metadata_id,
            version=(latest.version + 1) if latest else 1,
            content=content,
        )
        return self.create(new_version)
