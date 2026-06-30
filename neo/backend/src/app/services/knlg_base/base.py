"""Base service for knlg-base: workspace_code → id conversion, permission helpers."""

from sqlalchemy.orm import Session

from app.core.error_codes import ERR_NOT_FOUND
from app.core.exceptions import BusinessException
from app.models.user import User
from app.models.workspace_member import MemberRole
from app.repositories.workspace_repository import get_workspace_by_code


class KnlgBaseService:
    """Base service providing workspace + permission helpers."""

    def __init__(self, db: Session):
        self.db = db

    def _get_workspace_id(self, workspace_code: str) -> int:
        """Convert workspace_code to workspace_id, raising 404 if not found."""
        workspace = get_workspace_by_code(self.db, workspace_code)
        if not workspace:
            raise BusinessException(ERR_NOT_FOUND, f"Workspace '{workspace_code}' not found")
        return workspace.id

    def _check_permission(self, user: User, workspace_id: int, min_role: MemberRole) -> None:
        """Verify user has at least the specified role in the workspace.

        Role hierarchy: owner > admin > member > guest.
        Raises 403 if insufficient permission.
        """
        from app.models.workspace_member import WorkspaceMember

        member = (
            self.db.query(WorkspaceMember)
            .filter(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user.id,
            )
            .first()
        )
        if not member:
            raise BusinessException(403, "No access to this workspace")

        role_rank = {
            MemberRole.GUEST: 1,
            MemberRole.MEMBER: 2,
            MemberRole.ADMIN: 3,
            MemberRole.OWNER: 4,
        }
        if role_rank.get(member.role, 0) < role_rank.get(min_role, 99):
            raise BusinessException(403, f"Requires at least {min_role.value} role")

    def _require_read(self, user: User, workspace_id: int) -> None:
        """All roles can read."""
        self._check_permission(user, workspace_id, MemberRole.GUEST)

    def _require_write(self, user: User, workspace_id: int) -> None:
        """Member+ can write (create/update)."""
        self._check_permission(user, workspace_id, MemberRole.MEMBER)

    def _require_admin(self, user: User, workspace_id: int) -> None:
        """Admin+ can delete / change status / publish."""
        self._check_permission(user, workspace_id, MemberRole.ADMIN)
