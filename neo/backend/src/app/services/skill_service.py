"""Skill service for business logic."""

from typing import Any

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessException, ErrorCode
from app.models.file import File
from app.models.file_metadata import FileMetadata
from app.models.skill import Skill, SkillLevel, SkillStatus
from app.models.skill_version import SkillVersion
from app.repositories.skill_repository import (
    FileMetadataRepository,
    FileRepository,
    SkillRepository,
    SkillVersionRepository,
)
from app.schemas.file import FileMetadataCreate, FileMetadataUpdate
from app.schemas.skill import SkillCreate, SkillUpdate
from app.schemas.skill_version import SkillRollbackRequest, SkillVersionCreate


class SkillService:
    """Service for Skill business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.skill_repo = SkillRepository(db)
        self.version_repo = SkillVersionRepository(db)
        self.file_metadata_repo = FileMetadataRepository(db)
        self.file_repo = FileRepository(db)

    def create_skill(self, data: SkillCreate, user_id: int | None) -> Skill:
        """Create a new Skill."""
        # Check if code already exists
        existing = self.skill_repo.get_by_code(data.code)
        if existing:
            raise BusinessException(ErrorCode.CODE_CONFLICT, f"Skill with code '{data.code}' already exists")

        # Create skill
        skill = Skill(
            code=data.code,
            name=data.name,
            level=data.level,
            tags=data.tags or [],
            create_user_id=user_id,
            status=SkillStatus.DRAFT,
        )
        return self.skill_repo.create(skill)

    def get_skill(self, code: str) -> Skill:
        """Get a Skill by code."""
        skill = self.skill_repo.get_by_code_with_versions(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")
        return skill

    def update_skill(self, code: str, data: SkillUpdate) -> Skill:
        """Update Skill metadata."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        if data.name is not None:
            skill.name = data.name
        if data.level is not None:
            skill.level = data.level
        if data.tags is not None:
            skill.tags = data.tags

        return self.skill_repo.update(skill)

    def delete_skill(self, code: str) -> None:
        """Soft delete a Skill."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        # Cannot delete active skill
        if skill.status == SkillStatus.ACTIVE:
            raise BusinessException(ErrorCode.INVALID_OPERATION, "Cannot delete an active skill. Disable it first.")

        self.skill_repo.delete(skill)

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
        return self.skill_repo.list_skills(
            status=status,
            level=level,
            tags=tags,
            search=search,
            page=page,
            page_size=page_size,
        )

    def disable_skill(self, code: str) -> Skill:
        """Disable a Skill."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        skill.status = SkillStatus.DISABLED
        return self.skill_repo.update(skill)

    def enable_skill(self, code: str) -> Skill:
        """Enable a disabled Skill."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        skill.status = SkillStatus.ACTIVE
        return self.skill_repo.update(skill)

    def publish_skill(self, code: str, data: SkillVersionCreate) -> SkillVersion:
        """Publish a Skill version."""
        skill = self.skill_repo.get_by_code_with_versions(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        # Check version uniqueness
        existing = self.version_repo.get_by_version(skill.id, data.version)
        if existing:
            raise BusinessException(ErrorCode.VERSION_CONFLICT, f"Version '{data.version}' already exists")

        # Create version
        version = SkillVersion(
            skill_id=skill.id,
            version=data.version,
            file_snapshot=skill.draft_snapshot or [],
            comment=data.comment or "",
        )
        new_version = self.version_repo.create(version)

        # Update skill status to ACTIVE
        skill.status = SkillStatus.ACTIVE
        self.skill_repo.update(skill)

        return new_version

    def get_versions(self, code: str) -> list[dict[str, Any]]:
        """Get version history."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        versions = self.version_repo.get_versions_by_skill(skill.id)

        latest = versions[0] if versions else None
        return [
            {
                "id": v.id,
                "version": v.version,
                "comment": v.comment,
                "created_at": v.created_at.isoformat() if v.created_at else "",
                "file_count": len(v.file_snapshot) if v.file_snapshot else 0,
                "is_current": latest and v.id == latest.id,
            }
            for v in versions
        ]

    def rollback_skill(self, code: str, data: SkillRollbackRequest) -> dict[str, Any]:
        """Rollback a Skill to a previous version."""
        skill = self.skill_repo.get_by_code_with_versions(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        versions = self.version_repo.get_versions_by_skill(skill.id)
        target_version = None
        for v in versions:
            if v.id == data.version_id:
                target_version = v
                break

        if not target_version:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Version '{data.version_id}' not found")

        # Copy file_snapshot to draft_snapshot
        self.skill_repo.update_draft_snapshot(skill, target_version.file_snapshot)

        return {
            "code": code,
            "draft_snapshot": target_version.file_snapshot,
            "rolled_back_version": target_version.version,
        }

    def get_file_tree(self, code: str) -> list[dict[str, Any]]:
        """Get file tree for a Skill."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        files = self.file_metadata_repo.get_by_skill(skill.id)

        # Build tree structure
        tree = []
        path_to_node: dict[str, dict] = {}

        for f in files:
            parts = f.path.split("/")
            current_path = ""

            for i, part in enumerate(parts):
                parent_path = current_path
                current_path = "/".join(parts[: i + 1])
                is_file = i == len(parts) - 1

                if current_path in path_to_node:
                    continue

                node: dict[str, Any] = {
                    "id": f.id if is_file else 0,
                    "name": part,
                    "path": current_path,
                    "type": "file" if is_file else "directory",
                    "size": f.size if is_file else None,
                    "children": [] if not is_file else None,
                }

                if parent_path:
                    path_to_node[parent_path]["children"].append(node)
                else:
                    tree.append(node)

                path_to_node[current_path] = node

        return tree

    def get_file_content(self, code: str, path: str) -> dict[str, Any]:
        """Get file content."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        file_metadata = self.file_metadata_repo.get_by_path(path)
        if not file_metadata:
            raise BusinessException(ErrorCode.NOT_FOUND, f"File '{path}' not found")

        latest_file = self.file_repo.get_latest_version(file_metadata.id)
        if not latest_file:
            raise BusinessException(ErrorCode.NOT_FOUND, f"No content found for file '{path}'")

        return {
            "id": file_metadata.id,
            "name": file_metadata.name,
            "path": file_metadata.path,
            "size": file_metadata.size,
            "content": latest_file.content,
            "version": latest_file.version,
            "updated_at": latest_file.created_at.isoformat() if latest_file.created_at else "",
        }

    def create_file(self, code: str, data: FileMetadataCreate) -> dict[str, Any]:
        """Create a file in a Skill."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        # Check path uniqueness
        existing = self.file_metadata_repo.get_by_path(data.path)
        if existing:
            raise BusinessException(ErrorCode.PATH_CONFLICT, f"File with path '{data.path}' already exists")

        # Create file metadata
        file_metadata = FileMetadata(
            skill_id=skill.id,
            name=data.path.split("/")[-1],
            path=data.path,
            size=len(data.content.encode("utf-8")),
        )
        new_metadata = self.file_metadata_repo.create(file_metadata)

        # Create file content
        file = File(
            file_metadata_id=new_metadata.id,
            version=1,
            content=data.content,
        )
        new_file = self.file_repo.create(file)

        # Update draft snapshot
        draft = skill.draft_snapshot or []
        draft.append(
            {
                "file_metadata_id": new_metadata.id,
                "file_id": new_file.id,
            },
        )
        self.skill_repo.update_draft_snapshot(skill, draft)

        return {
            "id": new_metadata.id,
            "name": new_metadata.name,
            "path": new_metadata.path,
            "size": new_metadata.size,
            "version": new_file.version,
            "created_at": new_file.created_at.isoformat() if new_file.created_at else "",
        }

    def update_file(self, code: str, path: str, data: FileMetadataUpdate) -> dict[str, Any]:
        """Update a file in a Skill."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        file_metadata = self.file_metadata_repo.get_by_path(path)
        if not file_metadata:
            raise BusinessException(ErrorCode.NOT_FOUND, f"File '{path}' not found")

        # Create new version
        new_file = self.file_repo.create_new_version(file_metadata.id, data.content)

        # Update draft snapshot with new file_id
        draft = skill.draft_snapshot or []
        for item in draft:
            if item["file_metadata_id"] == file_metadata.id:
                item["file_id"] = new_file.id
                break
        self.skill_repo.update_draft_snapshot(skill, draft)

        return {
            "id": file_metadata.id,
            "name": file_metadata.name,
            "path": file_metadata.path,
            "size": new_file.content.__len__(),
            "version": new_file.version,
            "created_at": new_file.created_at.isoformat() if new_file.created_at else "",
        }

    def delete_file(self, code: str, path: str) -> None:
        """Delete a file from a Skill."""
        skill = self.skill_repo.get_by_code(code)
        if not skill:
            raise BusinessException(ErrorCode.NOT_FOUND, f"Skill '{code}' not found")

        file_metadata = self.file_metadata_repo.get_by_path(path)
        if not file_metadata:
            raise BusinessException(ErrorCode.NOT_FOUND, f"File '{path}' not found")

        # Cannot delete files from active skill (must disable first)
        if skill.status == SkillStatus.ACTIVE:
            raise BusinessException(
                ErrorCode.INVALID_OPERATION,
                "Cannot delete files from an active skill. Disable it first.",
            )

        # Remove from draft snapshot
        draft = skill.draft_snapshot or []
        draft = [item for item in draft if item["file_metadata_id"] != file_metadata.id]
        self.skill_repo.update_draft_snapshot(skill, draft)

        # Delete file metadata (cascades to files)
        self.file_metadata_repo.delete(file_metadata)
