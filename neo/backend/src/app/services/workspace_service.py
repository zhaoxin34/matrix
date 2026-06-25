"""Workspace service for business logic."""

from sqlalchemy.orm import Session

from app.models import MemberRole, WorkspaceStatus
from app.repositories import workspace_repository as repo
from app.schemas.workspace import (
    MemberAdd,
    MemberListItem,
    MemberListResponse,
    MemberResponse,
    MemberUpdate,
    TransferOwnerRequest,
    WorkspaceCreate,
    WorkspaceListItem,
    WorkspaceListResponse,
    WorkspaceResponse,
    WorkspaceUpdate,
)


class WorkspaceService:
    """Service for workspace operations."""

    def create_workspace(
        self,
        db: Session,
        data: WorkspaceCreate,
        owner_id: int,
    ) -> tuple[WorkspaceResponse, str]:
        """Create a new workspace.

        Args:
            db: Database session
            data: Workspace creation data
            owner_id: ID of the user creating the workspace

        Returns:
            Tuple of (workspace response, generated code)
        """
        workspace, code = repo.create_workspace(
            db=db,
            name=data.name,
            org_id=data.org_id,
            owner_id=owner_id,
            description=data.description,
        )

        return (
            WorkspaceResponse.model_validate(workspace),
            code,
        )

    def get_workspace(
        self,
        db: Session,
        workspace_id: int,
    ) -> WorkspaceResponse | None:
        """Get workspace by ID.

        Args:
            db: Database session
            workspace_id: Workspace ID

        Returns:
            Workspace response or None if not found
        """
        workspace = repo.get_workspace_by_id(db, workspace_id)
        if not workspace:
            return None

        response = WorkspaceResponse.model_validate(workspace)
        # Add computed fields
        response.member_count = repo.get_member_count(db, workspace_id)
        response.project_count = 0  # TODO: Implement project count

        return response

    def get_workspace_by_code(
        self,
        db: Session,
        code: str,
    ) -> WorkspaceResponse | None:
        """Get workspace by code.

        Args:
            db: Database session
            code: Workspace code

        Returns:
            Workspace response or None if not found
        """
        workspace = repo.get_workspace_by_code(db, code)
        if not workspace:
            return None

        response = WorkspaceResponse.model_validate(workspace)
        response.member_count = repo.get_member_count(db, workspace.id)
        response.project_count = 0  # TODO: Implement project count

        return response

    def get_workspaces(
        self,
        db: Session,
        org_id: int | None = None,
        status: WorkspaceStatus | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> WorkspaceListResponse:
        """Get workspaces with filters and pagination.

        Args:
            db: Database session
            org_id: Filter by organization ID
            status: Filter by status
            search: Search by name
            page: Page number
            page_size: Page size

        Returns:
            Paginated workspace list
        """
        workspaces, total = repo.get_workspaces(
            db=db,
            org_id=org_id,
            status=status,
            search=search,
            page=page,
            page_size=page_size,
        )

        items = []
        for workspace in workspaces:
            item = WorkspaceListItem.model_validate(workspace)
            item.member_count = repo.get_member_count(db, workspace.id)
            item.project_count = 0  # TODO: Implement project count
            items.append(item)

        return WorkspaceListResponse(
            total=total,
            page=page,
            page_size=page_size,
            list=items,
        )

    def get_user_workspaces(
        self,
        db: Session,
        user_id: int,
        status: WorkspaceStatus | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> WorkspaceListResponse:
        """Get workspaces accessible by a user.

        Args:
            db: Database session
            user_id: User ID
            status: Filter by status
            search: Search by name
            page: Page number
            page_size: Page size

        Returns:
            Paginated workspace list
        """
        workspaces, total = repo.get_workspaces_by_user(
            db=db,
            user_id=user_id,
            status=status,
            search=search,
            page=page,
            page_size=page_size,
        )

        items = []
        for workspace in workspaces:
            item = WorkspaceListItem.model_validate(workspace)
            item.member_count = repo.get_member_count(db, workspace.id)
            item.project_count = 0  # TODO: Implement project count
            items.append(item)

        return WorkspaceListResponse(
            total=total,
            page=page,
            page_size=page_size,
            list=items,
        )

    def update_workspace(
        self,
        db: Session,
        workspace_id: int,
        data: WorkspaceUpdate,
    ) -> WorkspaceResponse | None:
        """Update workspace information.

        Args:
            db: Database session
            workspace_id: Workspace ID
            data: Update data

        Returns:
            Updated workspace or None if not found
        """
        # Check if name is being changed and if it conflicts
        if data.name:
            workspace = repo.get_workspace_by_id(db, workspace_id)
            if workspace and data.name != workspace.name:
                if repo.is_name_exists(db, data.name, workspace.org_id, workspace_id):
                    return None  # Name conflict

        workspace = repo.update_workspace(
            db=db,
            workspace_id=workspace_id,
            name=data.name,
            description=data.description,
        )

        if not workspace:
            return None

        return WorkspaceResponse.model_validate(workspace)

    def disable_workspace(
        self,
        db: Session,
        workspace_id: int,
        disabled_by: int,
    ) -> WorkspaceResponse | None:
        """Disable a workspace.

        Args:
            db: Database session
            workspace_id: Workspace ID
            disabled_by: User ID performing the action

        Returns:
            Updated workspace or None if not found
        """
        workspace = repo.update_workspace_status(
            db=db,
            workspace_id=workspace_id,
            status=WorkspaceStatus.DISABLED,
            disabled_by=disabled_by,
        )

        if not workspace:
            return None

        return WorkspaceResponse.model_validate(workspace)

    def enable_workspace(
        self,
        db: Session,
        workspace_id: int,
    ) -> WorkspaceResponse | None:
        """Enable a workspace.

        Args:
            db: Database session
            workspace_id: Workspace ID

        Returns:
            Updated workspace or None if not found
        """
        workspace = repo.update_workspace_status(
            db=db,
            workspace_id=workspace_id,
            status=WorkspaceStatus.ACTIVE,
        )

        if not workspace:
            return None

        return WorkspaceResponse.model_validate(workspace)

    def transfer_ownership(
        self,
        db: Session,
        workspace_id: int,
        data: TransferOwnerRequest,
    ) -> WorkspaceResponse | None:
        """Transfer workspace ownership.

        Args:
            db: Database session
            workspace_id: Workspace ID
            data: Transfer request with new owner ID

        Returns:
            Updated workspace or None if not found
        """
        # Verify new owner exists
        if not repo.is_user_exists(db, data.new_owner_id):
            return None

        result = repo.transfer_ownership(
            db=db,
            workspace_id=workspace_id,
            new_owner_id=data.new_owner_id,
        )

        if not result:
            return None

        workspace, _, _ = result
        return WorkspaceResponse.model_validate(workspace)

    # ==================== Member Operations ====================

    def get_members(
        self,
        db: Session,
        workspace_id: int,
        role: MemberRole | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> MemberListResponse:
        """Get workspace members.

        Args:
            db: Database session
            workspace_id: Workspace ID
            role: Filter by role
            page: Page number
            page_size: Page size

        Returns:
            Paginated member list
        """
        members, total = repo.get_workspace_members(
            db=db,
            workspace_id=workspace_id,
            role=role,
            page=page,
            page_size=page_size,
        )

        items = []
        for member in members:
            item = MemberListItem(
                id=member.id,
                user_id=member.user_id,
                username=member.user.username if member.user else None,
                phone=member.user.phone if member.user else None,
                role=member.role,
                joined_at=member.created_at,
            )
            items.append(item)

        return MemberListResponse(
            total=total,
            page=page,
            page_size=page_size,
            list=items,
        )

    def add_member(
        self,
        db: Session,
        workspace_id: int,
        data: MemberAdd,
    ) -> MemberResponse | None:
        """Add a member to workspace.

        Args:
            db: Database session
            workspace_id: Workspace ID
            data: Member addition data

        Returns:
            Created member or None if user not found or already a member
        """
        # Verify user exists
        if not repo.is_user_exists(db, data.user_id):
            return None

        member = repo.add_workspace_member(
            db=db,
            workspace_id=workspace_id,
            user_id=data.user_id,
            role=MemberRole(data.role.value),
        )

        if not member:
            return None  # Already a member

        db.flush()  # Ensure the member has an ID before validation

        response = MemberResponse.model_validate(member)
        response.username = member.user.username if member.user else None
        response.phone = member.user.phone if member.user else None

        return response

    def update_member_role(
        self,
        db: Session,
        workspace_id: int,
        member_id: int,
        data: MemberUpdate,
    ) -> MemberResponse | None:
        """Update member role.

        Args:
            db: Database session
            workspace_id: Workspace ID
            member_id: Member ID
            data: Role update data

        Returns:
            Updated member or None if not found or is owner
        """
        member = repo.update_member_role(
            db=db,
            member_id=member_id,
            role=MemberRole(data.role.value),
        )

        if not member:
            return None

        response = MemberResponse.model_validate(member)
        response.username = member.user.username if member.user else None
        response.phone = member.user.phone if member.user else None

        return response

    def remove_member(
        self,
        db: Session,
        workspace_id: int,
        member_id: int,
    ) -> bool:
        """Remove a member from workspace.

        Args:
            db: Database session
            workspace_id: Workspace ID
            member_id: Member ID

        Returns:
            True if removed, False if not found or is owner
        """
        # Verify member belongs to this workspace
        member = repo.get_member_by_id(db, member_id)
        if not member or member.workspace_id != workspace_id:
            return False

        return repo.remove_workspace_member(db, member_id)

    def get_member_role(
        self,
        db: Session,
        workspace_id: int,
        user_id: int,
    ) -> MemberRole | None:
        """Get user's role in workspace.

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: User ID

        Returns:
            Member role or None if not a member
        """
        return repo.get_member_role(db, workspace_id, user_id)

    def is_owner(
        self,
        db: Session,
        workspace_id: int,
        user_id: int,
    ) -> bool:
        """Check if user is the owner of the workspace.

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: User ID

        Returns:
            True if user is owner
        """
        return repo.is_user_owner_of_workspace(db, workspace_id, user_id)

    def is_member(
        self,
        db: Session,
        workspace_id: int,
        user_id: int,
    ) -> bool:
        """Check if user is a member of the workspace.

        Args:
            db: Database session
            workspace_id: Workspace ID
            user_id: User ID

        Returns:
            True if user is a member
        """
        return repo.is_user_member_of_workspace(db, workspace_id, user_id)


# Global service instance
workspace_service = WorkspaceService()
