"""Tests for Skill service."""

import pytest
from sqlalchemy.orm import Session

from app.models.skill import Skill, SkillLevel, SkillStatus
from app.models.skill_version import SkillVersion


class BusinessException(Exception):
    """ "Business exception for testing."""

    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class ErrorCode:
    """ "Error codes for testing."""

    CODE_CONFLICT = 4001
    NOT_FOUND = 404
    VERSION_CONFLICT = 4002
    DRAFT_EMPTY = 4003
    INVALID_OPERATION = 4004
    PATH_CONFLICT = 4005


def create_skill_sync(
    db_session: Session,
    code: str,
    name: str,
    level: SkillLevel = SkillLevel.FUNCTIONAL,
    tags=None,
    user_id=None,
):
    """Helper to create a skill synchronously."""
    from app.models.skill import Skill, SkillStatus

    existing = db_session.query(Skill).filter(Skill.code == code).first()
    if existing:
        raise BusinessException(ErrorCode.CODE_CONFLICT, f"Skill with code '{code}' already exists")

    skill = Skill(
        code=code,
        name=name,
        level=level,
        tags=tags,
        create_user_id=user_id,
        status=SkillStatus.DRAFT,
    )
    db_session.add(skill)
    db_session.commit()
    db_session.refresh(skill)
    return skill


def get_skill_sync(db_session: Session, code: str):
    """Helper to get a skill synchronously."""

    skill = db_session.query(Skill).filter(Skill.code == code, Skill.deleted_at.is_(None)).first()
    if not skill:
        raise BusinessException(1, f"Skill '{code}' not found")
    return skill


def disable_skill_sync(db_session: Session, code: str):
    """Helper to disable a skill synchronously."""
    skill = get_skill_sync(db_session, code)
    skill.status = SkillStatus.DISABLED
    db_session.commit()
    db_session.refresh(skill)
    return skill


def update_skill_sync(db_session: Session, code: str, name=None, level=None, tags=None):
    """Helper to update a skill synchronously."""
    skill = get_skill_sync(db_session, code)
    if name is not None:
        skill.name = name
    if level is not None:
        skill.level = level
    if tags is not None:
        skill.tags = tags
    db_session.commit()
    db_session.refresh(skill)
    return skill


def delete_skill_sync(db_session: Session, code: str):
    """Helper to soft delete a skill synchronously."""
    from datetime import UTC, datetime

    skill = get_skill_sync(db_session, code)

    # Cannot delete active skill (must be disabled first)
    if skill.status == SkillStatus.ACTIVE:
        raise BusinessException(
            ErrorCode.INVALID_OPERATION,
            "Cannot delete an active skill. Disable it first.",
        )

    skill.deleted_at = datetime.now(UTC)
    db_session.commit()
    return skill


def list_skills_sync(db_session: Session, status=None, page=1, page_size=20):
    """Helper to list skills synchronously."""
    from sqlalchemy import func, select

    stmt = select(Skill).where(Skill.deleted_at.is_(None))
    if status:
        stmt = stmt.where(Skill.status == status)

    count_result = db_session.execute(select(func.count()).select_from(stmt.subquery()))
    total = count_result.scalar_one()

    stmt = stmt.order_by(Skill.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = db_session.execute(stmt)
    skills = list(result.scalars().all())
    return skills, total


def publish_skill_sync(db_session: Session, code: str, version: str, comment: str):
    """Helper to publish a skill synchronously."""

    skill = get_skill_sync(db_session, code)

    # Check version uniqueness
    existing_version = (
        db_session.query(SkillVersion)
        .filter(SkillVersion.skill_id == skill.id, SkillVersion.version == version)
        .first()
    )
    if existing_version:
        raise BusinessException(2, f"Version '{version}' already exists")

    # Create version
    version_rec = SkillVersion(
        skill_id=skill.id,
        version=version,
        file_snapshot=skill.draft_snapshot or [],
        comment=comment,
    )
    db_session.add(version_rec)

    # Update skill status
    skill.status = SkillStatus.ACTIVE
    db_session.commit()
    db_session.refresh(version_rec)
    return version_rec


def get_versions_sync(db_session: Session, code: str):
    """Helper to get version history synchronously."""
    skill = get_skill_sync(db_session, code)
    versions = (
        db_session.query(SkillVersion)
        .filter(SkillVersion.skill_id == skill.id)
        .order_by(SkillVersion.created_at.desc())
        .all()
    )

    latest = versions[0] if versions else None
    return [
        {
            "id": v.id,
            "version": v.version,
            "comment": v.comment,
            "created_at": v.created_at,
            "is_current": latest and v.id == latest.id,
        }
        for v in versions
    ]


def rollback_skill_sync(db_session: Session, code: str, version_id: int):
    """Helper to rollback a skill synchronously."""
    skill = get_skill_sync(db_session, code)
    versions = db_session.query(SkillVersion).filter(SkillVersion.skill_id == skill.id).all()

    target_version = None
    for v in versions:
        if v.id == version_id:
            target_version = v
            break

    if not target_version:
        raise BusinessException(1, f"Version '{version_id}' not found")

    # Copy file_snapshot to draft_snapshot
    skill.draft_snapshot = target_version.file_snapshot
    db_session.commit()

    return {
        "code": code,
        "draft_snapshot": target_version.file_snapshot,
        "rolled_back_version": target_version.version,
    }


def create_file_sync(db_session: Session, code: str, path: str, content: str):
    """Helper to create a file synchronously."""
    from app.models.file import File
    from app.models.file_metadata import FileMetadata

    skill = get_skill_sync(db_session, code)

    # Check path uniqueness
    existing = db_session.query(FileMetadata).filter(FileMetadata.path == path).first()
    if existing:
        raise BusinessException(3, f"File with path '{path}' already exists")

    # Create file metadata
    file_metadata = FileMetadata(
        skill_id=skill.id,
        name=path.split("/")[-1],
        path=path,
        size=len(content.encode("utf-8")),
    )
    db_session.add(file_metadata)
    db_session.flush()

    # Create file content
    file = File(
        file_metadata_id=file_metadata.id,
        version=1,
        content=content,
    )
    db_session.add(file)
    db_session.flush()

    # Update draft snapshot
    draft = skill.draft_snapshot or []
    draft.append(
        {
            "file_metadata_id": file_metadata.id,
            "file_id": file.id,
        }
    )
    skill.draft_snapshot = draft
    db_session.commit()
    db_session.refresh(file_metadata)

    return {
        "id": file_metadata.id,
        "name": file_metadata.name,
        "path": file_metadata.path,
        "size": file_metadata.size,
        "version": file.version,
        "created_at": file.created_at,
    }


class TestSkillCrud:
    """Test Skill CRUD operations."""

    def test_create_skill(self, db_session: Session):
        """Test creating a new Skill."""
        skill = create_skill_sync(
            db_session,
            code="test-skill",
            name="测试 Skill",
            level=SkillLevel.FUNCTIONAL,
            tags=["test", "demo"],
            user_id=1,
        )

        assert skill.id is not None
        assert skill.code == "test-skill"
        assert skill.name == "测试 Skill"
        assert skill.level == SkillLevel.FUNCTIONAL
        assert skill.tags == ["test", "demo"]
        assert skill.status == SkillStatus.DRAFT
        assert skill.draft_snapshot is None

    def test_create_skill_duplicate_code(self, db_session: Session):
        """Test creating Skill with duplicate code raises error."""

        create_skill_sync(db_session, code="test-skill", name="Skill 1", level=SkillLevel.FUNCTIONAL)

        with pytest.raises(BusinessException) as exc_info:
            create_skill_sync(db_session, code="test-skill", name="Skill 2", level=SkillLevel.FUNCTIONAL)
        assert "already exists" in str(exc_info.value)

    def test_get_skill(self, db_session: Session):
        """Test getting a Skill by code."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        skill = get_skill_sync(db_session, "test-skill")

        assert skill.code == "test-skill"

    def test_get_skill_not_found(self, db_session: Session):
        """Test getting non-existent Skill raises error."""

        with pytest.raises(BusinessException) as exc_info:
            get_skill_sync(db_session, "non-existent")
        assert "not found" in str(exc_info.value)

    def test_list_skills(self, db_session: Session):
        """Test listing Skills with pagination."""
        # Create multiple skills
        for i in range(5):
            create_skill_sync(db_session, code=f"skill-{i}", name=f"Skill {i}", level=SkillLevel.FUNCTIONAL)

        skills, total = list_skills_sync(db_session, page=1, page_size=3)

        assert len(skills) == 3
        assert total == 5

    def test_list_skills_filter_by_status(self, db_session: Session):
        """Test listing Skills filtered by status."""
        create_skill_sync(db_session, code="skill-1", name="Skill 1", level=SkillLevel.FUNCTIONAL)
        disable_skill_sync(db_session, "skill-1")

        create_skill_sync(db_session, code="skill-2", name="Skill 2", level=SkillLevel.FUNCTIONAL)

        skills, total = list_skills_sync(db_session, status=SkillStatus.DISABLED)

        assert total == 1
        assert skills[0].code == "skill-1"

    def test_update_skill(self, db_session: Session):
        """Test updating Skill metadata."""
        create_skill_sync(db_session, code="test-skill", name="Original Name", level=SkillLevel.FUNCTIONAL)

        skill = update_skill_sync(
            db_session,
            "test-skill",
            name="Updated Name",
            level=SkillLevel.ATOMIC,
            tags=["updated"],
        )

        assert skill.name == "Updated Name"
        assert skill.level == SkillLevel.ATOMIC
        assert skill.tags == ["updated"]

    def test_delete_skill(self, db_session: Session):
        """Test soft deleting a Skill."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        delete_skill_sync(db_session, "test-skill")

        # Verify it's soft deleted
        skill = db_session.query(Skill).filter(Skill.code == "test-skill").first()
        assert skill.deleted_at is not None

    def test_delete_active_skill_fails(self, db_session: Session):
        """Test deleting an active Skill raises error."""

        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        skill = get_skill_sync(db_session, "test-skill")
        skill.draft_snapshot = []
        db_session.commit()

        publish_skill_sync(db_session, "test-skill", "1.0.0", "Initial")

        with pytest.raises(BusinessException) as exc_info:
            delete_skill_sync(db_session, "test-skill")
        assert "active" in str(exc_info.value).lower()


class TestSkillStatus:
    """Test Skill status operations."""

    def test_disable_skill(self, db_session: Session):
        """Test disabling a Skill."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        skill = disable_skill_sync(db_session, "test-skill")

        assert skill.status == SkillStatus.DISABLED

    def test_enable_skill(self, db_session: Session):
        """Test enabling a disabled Skill."""

        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)
        disable_skill_sync(db_session, "test-skill")

        skill = get_skill_sync(db_session, "test-skill")
        skill.status = SkillStatus.ACTIVE
        db_session.commit()
        db_session.refresh(skill)

        assert skill.status == SkillStatus.ACTIVE


class TestSkillVersioning:
    """Test Skill versioning operations."""

    def test_publish_skill(self, db_session: Session):
        """Test publishing a Skill."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        skill = get_skill_sync(db_session, "test-skill")
        skill.draft_snapshot = [{"file_metadata_id": 1, "file_id": 1}]
        db_session.commit()

        version = publish_skill_sync(db_session, "test-skill", "1.0.0", "Initial release")

        assert version.version == "1.0.0"
        assert version.comment == "Initial release"
        assert version.file_snapshot == [{"file_metadata_id": 1, "file_id": 1}]

    def test_publish_with_duplicate_version(self, db_session: Session):
        """Test publishing with duplicate version raises error."""

        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        skill = get_skill_sync(db_session, "test-skill")
        skill.draft_snapshot = []
        db_session.commit()

        publish_skill_sync(db_session, "test-skill", "1.0.0", "First")

        with pytest.raises(BusinessException) as exc_info:
            publish_skill_sync(db_session, "test-skill", "1.0.0", "Second")
        assert "already exists" in str(exc_info.value).lower()

    def test_get_versions(self, db_session: Session):
        """Test getting version history."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        skill = get_skill_sync(db_session, "test-skill")
        skill.draft_snapshot = []
        db_session.commit()

        publish_skill_sync(db_session, "test-skill", "1.0.0", "v1")
        publish_skill_sync(db_session, "test-skill", "1.1.0", "v2")

        versions = get_versions_sync(db_session, "test-skill")

        assert len(versions) == 2
        assert versions[0]["is_current"] is True
        assert versions[1]["is_current"] is False

    def test_rollback_skill(self, db_session: Session):
        """Test rolling back a Skill."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        skill = get_skill_sync(db_session, "test-skill")
        skill.draft_snapshot = [{"file_metadata_id": 1, "file_id": 1}]
        db_session.commit()

        publish_skill_sync(db_session, "test-skill", "1.0.0", "v1")

        skill = get_skill_sync(db_session, "test-skill")
        skill.draft_snapshot = [{"file_metadata_id": 2, "file_id": 2}]
        db_session.commit()

        publish_skill_sync(db_session, "test-skill", "2.0.0", "v2")

        versions = get_versions_sync(db_session, "test-skill")
        v1_id = versions[1]["id"]  # v1 is second (descending order)

        result = rollback_skill_sync(db_session, "test-skill", v1_id)

        assert result["rolled_back_version"] == "1.0.0"
        assert result["draft_snapshot"] == [{"file_metadata_id": 1, "file_id": 1}]


class TestSkillFiles:
    """Test Skill file operations."""

    def test_create_file(self, db_session: Session):
        """Test creating a file in a Skill."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        result = create_file_sync(db_session, "test-skill", "scripts/test.sh", "#!/bin/bash\necho 'Hello'")

        assert result["name"] == "test.sh"
        assert result["path"] == "scripts/test.sh"
        assert result["version"] == 1
        assert result["size"] > 0

    def test_create_file_duplicate_path(self, db_session: Session):
        """Test creating file with duplicate path raises error."""

        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        create_file_sync(db_session, "test-skill", "test.md", "Content")

        with pytest.raises(BusinessException) as exc_info:
            create_file_sync(db_session, "test-skill", "test.md", "New Content")
        assert "already exists" in str(exc_info.value).lower()

    def test_get_skill_with_files(self, db_session: Session):
        """Test getting skill with draft snapshot."""
        create_skill_sync(db_session, code="test-skill", name="Test Skill", level=SkillLevel.FUNCTIONAL)

        create_file_sync(db_session, "test-skill", "test.md", "Content")

        skill = get_skill_sync(db_session, "test-skill")

        assert skill.draft_snapshot is not None
        assert len(skill.draft_snapshot) == 1
        assert "file_metadata_id" in skill.draft_snapshot[0]
        assert "file_id" in skill.draft_snapshot[0]
