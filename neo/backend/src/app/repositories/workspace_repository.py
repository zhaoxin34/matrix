"""Workspace repository for database operations."""

import re
from datetime import UTC, datetime

import pypinyin
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models import MemberRole, User, Workspace, WorkspaceMember, WorkspaceStatus


def generate_code(name: str) -> str:
    """Generate URL-friendly code from name.

    Converts Chinese characters to pinyin and removes special characters.
    """
    # Convert Chinese to pinyin
    pinyin_strs = pypinyin.lazy_pinyin(name)
    code = "_".join(pinyin_strs)

    # Remove non-alphanumeric characters and convert to lowercase
    code = re.sub(r"[^a-z0-9_-]", "", code.lower())

    # Limit length and add timestamp for uniqueness
    code = code[:40]
    return code


def is_code_exists(db: Session, code: str, exclude_id: int | None = None) -> bool:
    """Check if workspace code already exists."""
    query = select(func.count(Workspace.id)).where(Workspace.code == code)
    if exclude_id:
        query = query.where(Workspace.id != exclude_id)
    count = db.execute(query).scalar()
    return count > 0


def is_name_exists(db: Session, name: str, org_id: int, exclude_id: int | None = None) -> bool:
    """Check if workspace name already exists in the organization."""
    query = select(func.count(Workspace.id)).where(
        and_(
            Workspace.name == name,
            Workspace.org_id == org_id,
        ),
    )
    if exclude_id:
        query = query.where(Workspace.id != exclude_id)
    count = db.execute(query).scalar()
    return count > 0


def create_workspace(
    db: Session,
    name: str,
    org_id: int,
    owner_id: int,
    description: str | None = None,
    settings: str | None = None,
) -> tuple[Workspace, str]:
    """Create a new workspace.

    Returns:
        Tuple of (workspace, generated_code)
    """
    # Generate unique code
    base_code = generate_code(name)
    code = base_code
    counter = 1
    while is_code_exists(db, code):
        code = f"{base_code}_{counter}"
        counter += 1

    # Create workspace
    workspace = Workspace(
        name=name,
        code=code,
        description=description,
        status=WorkspaceStatus.ACTIVE,
        org_id=org_id,
        owner_id=owner_id,
        settings=settings,
    )
    db.add(workspace)
    db.flush()

    # Create owner member record
    owner_member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=owner_id,
        role=MemberRole.OWNER,
    )
    db.add(owner_member)

    return workspace, code


def get_workspace_by_id(db: Session, workspace_id: int) -> Workspace | None:
    """Get workspace by ID."""
    return db.query(Workspace).filter(Workspace.id == workspace_id).first()


def get_workspace_by_code(db: Session, code: str) -> Workspace | None:
    """Get workspace by code."""
    return db.query(Workspace).filter(Workspace.code == code).first()


def get_workspaces(
    db: Session,
    org_id: int | None = None,
    status: WorkspaceStatus | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Workspace], int]:
    """Get workspaces with filters and pagination.

    Returns:
        Tuple of (workspaces, total_count)
    """
    query = db.query(Workspace)

    # Apply filters
    if org_id is not None:
        query = query.filter(Workspace.org_id == org_id)
    if status:
        query = query.filter(Workspace.status == status)
    if search:
        query = query.filter(Workspace.name.ilike(f"%{search}%"))

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    workspaces = query.order_by(Workspace.created_at.desc()).offset(offset).limit(page_size).all()

    return workspaces, total


def get_workspaces_by_user(
    db: Session,
    user_id: int,
    status: WorkspaceStatus | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Workspace], int]:
    """Get workspaces accessible by a user.

    Returns:
        Tuple of (workspaces, total_count)
    """
    # Get workspace IDs where user is a member
    member_workspace_ids = select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user_id)

    query = db.query(Workspace).filter(Workspace.id.in_(member_workspace_ids))

    # Apply filters
    if status:
        query = query.filter(Workspace.status == status)
    if search:
        query = query.filter(Workspace.name.ilike(f"%{search}%"))

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    workspaces = query.order_by(Workspace.created_at.desc()).offset(offset).limit(page_size).all()

    return workspaces, total


def update_workspace(
    db: Session,
    workspace_id: int,
    name: str | None = None,
    description: str | None = None,
) -> Workspace | None:
    """Update workspace information."""
    workspace = get_workspace_by_id(db, workspace_id)
    if not workspace:
        return None

    if name is not None:
        workspace.name = name
    if description is not None:
        workspace.description = description

    workspace.updated_at = datetime.now(UTC)
    return workspace


def update_workspace_status(
    db: Session,
    workspace_id: int,
    status: WorkspaceStatus,
    disabled_by: int | None = None,
) -> Workspace | None:
    """Update workspace status (enable/disable)."""
    workspace = get_workspace_by_id(db, workspace_id)
    if not workspace:
        return None

    workspace.status = status
    workspace.updated_at = datetime.now(UTC)

    if status == WorkspaceStatus.DISABLED:
        workspace.disabled_at = datetime.now(UTC)
        workspace.disabled_by = disabled_by
    else:
        workspace.disabled_at = None
        workspace.disabled_by = None

    return workspace


def transfer_ownership(
    db: Session,
    workspace_id: int,
    new_owner_id: int,
) -> tuple[Workspace, WorkspaceMember, WorkspaceMember] | None:
    """Transfer workspace ownership to another user.

    Returns:
        Tuple of (workspace, old_owner_member, new_owner_member) or None if workspace not found
    """
    workspace = get_workspace_by_id(db, workspace_id)
    if not workspace:
        return None

    # Get old owner member record
    old_owner_member = get_member_by_workspace_and_user(db, workspace_id, workspace.owner_id)
    if not old_owner_member:
        return None

    # Get or create new owner member record
    new_owner_member = get_member_by_workspace_and_user(db, workspace_id, new_owner_id)
    if not new_owner_member:
        new_owner_member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=new_owner_id,
            role=MemberRole.OWNER,
        )
        db.add(new_owner_member)
    else:
        new_owner_member.role = MemberRole.OWNER

    # Downgrade old owner to admin
    old_owner_member.role = MemberRole.ADMIN
    old_owner_member.updated_at = datetime.now(UTC)

    # Update workspace owner
    workspace.owner_id = new_owner_id
    workspace.updated_at = datetime.now(UTC)

    db.flush()
    return workspace, old_owner_member, new_owner_member


def get_member_count(db: Session, workspace_id: int) -> int:
    """Get member count for a workspace."""
    return db.query(func.count(WorkspaceMember.id)).filter(WorkspaceMember.workspace_id == workspace_id).scalar()


# ==================== Workspace Member Operations ====================


def get_member_by_id(db: Session, member_id: int) -> WorkspaceMember | None:
    """Get workspace member by ID."""
    return db.query(WorkspaceMember).filter(WorkspaceMember.id == member_id).first()


def get_member_by_workspace_and_user(
    db: Session,
    workspace_id: int,
    user_id: int,
) -> WorkspaceMember | None:
    """Get workspace member by workspace and user."""
    return (
        db.query(WorkspaceMember)
        .filter(
            and_(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            ),
        )
        .first()
    )


def is_user_member_of_workspace(db: Session, workspace_id: int, user_id: int) -> bool:
    """Check if user is a member of the workspace."""
    member = get_member_by_workspace_and_user(db, workspace_id, user_id)
    return member is not None


def is_user_owner_of_workspace(db: Session, workspace_id: int, user_id: int) -> bool:
    """Check if user is the owner of the workspace."""
    workspace = get_workspace_by_id(db, workspace_id)
    if not workspace:
        return False
    return workspace.owner_id == user_id


def get_member_role(
    db: Session,
    workspace_id: int,
    user_id: int,
) -> MemberRole | None:
    """Get user's role in the workspace."""
    member = get_member_by_workspace_and_user(db, workspace_id, user_id)
    if not member:
        return None
    return member.role


def get_workspace_members(
    db: Session,
    workspace_id: int,
    role: MemberRole | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[WorkspaceMember], int]:
    """Get workspace members with filters and pagination.

    Returns:
        Tuple of (members, total_count)
    """
    query = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id)

    if role:
        query = query.filter(WorkspaceMember.role == role)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    members = query.order_by(WorkspaceMember.created_at.desc()).offset(offset).limit(page_size).all()

    return members, total


def add_workspace_member(
    db: Session,
    workspace_id: int,
    user_id: int,
    role: MemberRole = MemberRole.MEMBER,
) -> WorkspaceMember | None:
    """Add a member to workspace."""
    # Check if already a member
    existing = get_member_by_workspace_and_user(db, workspace_id, user_id)
    if existing:
        return None  # Already a member

    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user_id,
        role=role,
    )
    db.add(member)
    return member


def update_member_role(
    db: Session,
    member_id: int,
    role: MemberRole,
) -> WorkspaceMember | None:
    """Update member's role in the workspace."""
    member = get_member_by_id(db, member_id)
    if not member:
        return None

    # Cannot change owner role
    if member.role == MemberRole.OWNER:
        return None

    member.role = role
    member.updated_at = datetime.now(UTC)
    return member


def remove_workspace_member(
    db: Session,
    member_id: int,
) -> bool:
    """Remove a member from workspace.

    Returns:
        True if removed, False if not found or is owner
    """
    member = get_member_by_id(db, member_id)
    if not member:
        return False

    # Cannot remove owner
    if member.role == MemberRole.OWNER:
        return False

    db.delete(member)
    return True


def is_user_exists(db: Session, user_id: int) -> bool:
    """Check if user exists."""
    count = db.query(func.count(User.id)).filter(User.id == user_id).scalar()
    return count > 0
