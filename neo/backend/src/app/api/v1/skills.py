"""Skills API routes."""

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_BAD_REQUEST,
    ERR_CONFLICT,
    ERR_NOT_FOUND,
    ERR_OK,
)
from app.database import get_db
from app.models.skill import SkillLevel, SkillStatus
from app.schemas.file import (
    FileMetadataCreate,
    FileMetadataUpdate,
)
from app.schemas.skill import (
    SkillCreate,
    SkillUpdate,
)
from app.schemas.skill_version import (
    SkillRollbackRequest,
    SkillVersionCreate,
)
from app.services.skill_service import SkillService

router = APIRouter(prefix="/api/v1/skills", tags=["skills"])


def _make_response(data=None, code: int = ERR_OK, message: str = "ok") -> dict:
    """Helper to create standard response."""
    return {
        "code": code,
        "message": message,
        "data": data,
        "traceId": "",
        "timestamp": 0,
    }


def _make_error_response(code: int, message: str) -> dict:
    """Helper to create error response."""
    return _make_response(None, code, message)


def _skill_to_detail(skill, versions=None) -> dict:
    """Convert Skill model to detail response."""
    current_version = None
    if versions:
        latest = versions[0] if versions else None
        if latest:
            current_version = {
                "id": latest.id,
                "version": latest.version,
                "comment": latest.comment,
                "created_at": latest.created_at,
            }

    draft_snapshot = None
    if skill.draft_snapshot:
        draft_snapshot = [
            {"file_metadata_id": item["file_metadata_id"], "file_id": item["file_id"]} for item in skill.draft_snapshot
        ]

    return {
        "id": skill.id,
        "code": skill.code,
        "name": skill.name,
        "level": skill.level.value,
        "tags": skill.tags or [],
        "status": skill.status.value,
        "draft_snapshot": draft_snapshot,
        "current_version": current_version,
        "create_user_id": skill.create_user_id,
        "created_at": skill.created_at.isoformat(),
        "updated_at": skill.updated_at.isoformat(),
    }


@router.post("", response_model=dict)
async def create_skill(
    request: SkillCreate,
    db: Session = Depends(get_db),
) -> dict:
    """Create a new Skill."""
    service = SkillService(db)
    try:
        skill = service.create_skill(request, user_id=None)
        return _make_response(
            {
                "id": skill.id,
                "code": skill.code,
                "name": skill.name,
                "level": skill.level.value,
                "tags": skill.tags or [],
                "status": skill.status.value,
                "draft_snapshot": None,
                "create_user_id": skill.create_user_id,
                "created_at": skill.created_at.isoformat(),
                "updated_at": skill.updated_at.isoformat(),
            }
        )
    except Exception as e:
        if "already exists" in str(e):
            return _make_error_response(ERR_CONFLICT, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.get("", response_model=dict)
async def list_skills(
    status: str | None = Query(None, description="Filter by status"),
    level: str | None = Query(None, description="Filter by level"),
    tags: str | None = Query(None, description="Filter by tags (comma-separated)"),
    search: str | None = Query(None, description="Search by name or code"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    """List Skills with filters and pagination."""
    # Parse enums
    status_enum = None
    if status:
        try:
            status_enum = SkillStatus(status)
        except ValueError:
            return _make_error_response(ERR_BAD_REQUEST, f"Invalid status: {status}")

    level_enum = None
    if level:
        try:
            level_enum = SkillLevel(level)
        except ValueError:
            return _make_error_response(ERR_BAD_REQUEST, f"Invalid level: {level}")

    tags_list = None
    if tags:
        tags_list = [t.strip() for t in tags.split(",")]

    service = SkillService(db)
    skills, total = service.list_skills(
        status=status_enum,
        level=level_enum,
        tags=tags_list,
        search=search,
        page=page,
        page_size=page_size,
    )

    items = []
    for skill in skills:
        items.append(
            {
                "id": skill.id,
                "code": skill.code,
                "name": skill.name,
                "level": skill.level.value,
                "tags": skill.tags or [],
                "status": skill.status.value,
                "current_version": None,
                "created_at": skill.created_at.isoformat(),
            }
        )

    return _make_response(
        {
            "total": total,
            "items": items,
            "page": page,
            "page_size": page_size,
        }
    )


@router.get("/{code}", response_model=dict)
async def get_skill(
    code: str = Path(..., description="Skill code"),
    db: Session = Depends(get_db),
) -> dict:
    """Get Skill detail."""
    service = SkillService(db)
    try:
        skill = service.get_skill(code)
        return _make_response(_skill_to_detail(skill, getattr(skill, "versions", None)))
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.patch("/{code}", response_model=dict)
async def update_skill(
    code: str = Path(..., description="Skill code"),
    request: SkillUpdate = None,
    db: Session = Depends(get_db),
) -> dict:
    """Update Skill metadata."""
    service = SkillService(db)
    try:
        skill = service.update_skill(code, request)
        return _make_response(
            {
                "id": skill.id,
                "code": skill.code,
                "name": skill.name,
                "level": skill.level.value,
                "tags": skill.tags or [],
                "status": skill.status.value,
                "draft_snapshot": skill.draft_snapshot,
                "create_user_id": skill.create_user_id,
                "created_at": skill.created_at.isoformat(),
                "updated_at": skill.updated_at.isoformat(),
            }
        )
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.delete("/{code}", response_model=dict)
async def delete_skill(
    code: str = Path(..., description="Skill code"),
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete a Skill."""
    service = SkillService(db)
    try:
        service.delete_skill(code)
        return _make_response({"success": True})
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        if "active" in str(e).lower():
            return _make_error_response(ERR_BAD_REQUEST, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.post("/{code}/disable", response_model=dict)
async def disable_skill(
    code: str = Path(..., description="Skill code"),
    db: Session = Depends(get_db),
) -> dict:
    """Disable a Skill."""
    service = SkillService(db)
    try:
        skill = service.disable_skill(code)
        return _make_response(
            {
                "code": skill.code,
                "status": skill.status.value,
                "disabled_at": skill.updated_at.isoformat(),
            }
        )
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.post("/{code}/enable", response_model=dict)
async def enable_skill(
    code: str = Path(..., description="Skill code"),
    db: Session = Depends(get_db),
) -> dict:
    """Enable a Skill."""
    service = SkillService(db)
    try:
        skill = service.enable_skill(code)
        return _make_response(
            {
                "code": skill.code,
                "status": skill.status.value,
            }
        )
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.post("/{code}/publish", response_model=dict)
async def publish_skill(
    code: str = Path(..., description="Skill code"),
    request: SkillVersionCreate = None,
    db: Session = Depends(get_db),
) -> dict:
    """Publish a Skill version."""
    service = SkillService(db)
    try:
        version = service.publish_skill(code, request)
        return _make_response(
            {
                "id": version.id,
                "skill_id": version.skill_id,
                "version": version.version,
                "file_snapshot": version.file_snapshot,
                "comment": version.comment,
                "created_at": version.created_at.isoformat(),
            }
        )
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        if "already exists" in str(e).lower():
            return _make_error_response(ERR_CONFLICT, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.get("/{code}/versions", response_model=dict)
async def get_versions(
    code: str = Path(..., description="Skill code"),
    db: Session = Depends(get_db),
) -> dict:
    """Get version history."""
    service = SkillService(db)
    try:
        versions = service.get_versions(code)
        return _make_response(
            {
                "total": len(versions),
                "versions": versions,
            }
        )
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.post("/{code}/rollback", response_model=dict)
async def rollback_skill(
    code: str = Path(..., description="Skill code"),
    request: SkillRollbackRequest = None,
    db: Session = Depends(get_db),
) -> dict:
    """Rollback a Skill to a previous version."""
    service = SkillService(db)
    try:
        result = service.rollback_skill(code, request)
        return _make_response(
            {
                "code": result["code"],
                "draft_snapshot": result["draft_snapshot"],
                "rolled_back_version": result["rolled_back_version"],
            }
        )
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.get("/{code}/files", response_model=dict)
async def get_file_tree(
    code: str = Path(..., description="Skill code"),
    db: Session = Depends(get_db),
) -> dict:
    """Get file tree for a Skill."""
    service = SkillService(db)
    try:
        tree = service.get_file_tree(code)
        return _make_response({"tree": tree})
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.get("/{code}/files/{path:path}", response_model=dict)
async def get_file_content(
    code: str = Path(..., description="Skill code"),
    path: str = Path(..., description="File path"),
    db: Session = Depends(get_db),
) -> dict:
    """Get file content."""
    service = SkillService(db)
    try:
        result = service.get_file_content(code, path)
        return _make_response({"content": result})
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.post("/{code}/files", response_model=dict)
async def create_file(
    code: str = Path(..., description="Skill code"),
    request: FileMetadataCreate = None,
    db: Session = Depends(get_db),
) -> dict:
    """Create a file in a Skill."""
    service = SkillService(db)
    try:
        result = service.create_file(code, request)
        return _make_response(result)
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        if "already exists" in str(e).lower():
            return _make_error_response(ERR_CONFLICT, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.put("/{code}/files/{path:path}", response_model=dict)
async def update_file(
    code: str = Path(..., description="Skill code"),
    path: str = Path(..., description="File path"),
    request: FileMetadataUpdate = None,
    db: Session = Depends(get_db),
) -> dict:
    """Update a file in a Skill."""
    service = SkillService(db)
    try:
        result = service.update_file(code, path, request)
        return _make_response(result)
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))


@router.delete("/{code}/files/{path:path}", response_model=dict)
async def delete_file(
    code: str = Path(..., description="Skill code"),
    path: str = Path(..., description="File path"),
    db: Session = Depends(get_db),
) -> dict:
    """Delete a file from a Skill."""
    service = SkillService(db)
    try:
        service.delete_file(code, path)
        return _make_response({"success": True})
    except Exception as e:
        if "not found" in str(e):
            return _make_error_response(ERR_NOT_FOUND, str(e))
        if "active" in str(e).lower():
            return _make_error_response(ERR_BAD_REQUEST, str(e))
        return _make_error_response(ERR_BAD_REQUEST, str(e))
