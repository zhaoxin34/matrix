"""Organization Unit service."""

from typing import List, Optional, Tuple

from app.models import OrganizationUnit, OrgUnitStatus, OrgUnitType
from app.repositories import org_unit_repository as repo


class OrgUnitService:
    """Service for organization unit operations."""

    MAX_LEVEL = 4  # Maximum hierarchy depth

    @staticmethod
    def get_org_unit_by_id(db, unit_id: int) -> Optional[OrganizationUnit]:
        """Get organization unit by ID."""
        return repo.get_org_unit_by_id(db, unit_id)

    @staticmethod
    def get_org_unit_by_code(db, code: str) -> Optional[OrganizationUnit]:
        """Get organization unit by code."""
        return repo.get_org_unit_by_code(db, code)

    @staticmethod
    def get_org_units(
        db,
        status: Optional[OrgUnitStatus] = None,
    ) -> List[OrganizationUnit]:
        """Get all organization units."""
        return repo.get_org_units(db, status)

    @staticmethod
    def get_org_unit_tree(
        db,
        status: Optional[OrgUnitStatus] = None,
    ) -> List[dict]:
        """Get organization units as a tree structure."""
        units = repo.get_org_units(db, status)

        # Build tree structure
        children_map: dict[Optional[int], list] = {}

        for unit in units:
            parent_id = unit.parent_id if unit.parent_id is not None else None
            children_map.setdefault(parent_id, []).append(unit)

        def build_tree(parent_id: Optional[int]) -> List[dict]:
            children = children_map.get(parent_id, [])
            result = []
            for unit in children:
                result.append(
                    {
                        "id": unit.id,
                        "name": unit.name,
                        "code": unit.code,
                        "type": unit.type,
                        "level": unit.level,
                        "sort_order": unit.sort_order,
                        "leader_id": unit.leader_id,
                        "status": unit.status,
                        "children": build_tree(unit.id),
                    }
                )
            return result

        return build_tree(None)

    @staticmethod
    def get_root_units(db, status: Optional[OrgUnitStatus] = None) -> List[OrganizationUnit]:
        """Get root organization units."""
        return repo.get_root_units(db, status)

    @staticmethod
    def get_children_units(db, parent_id: int) -> List[OrganizationUnit]:
        """Get child organization units."""
        return repo.get_children_units(db, parent_id)

    @staticmethod
    def has_children(db, unit_id: int) -> bool:
        """Check if organization unit has children."""
        return repo.has_children(db, unit_id)

    @staticmethod
    def create_org_unit(
        db,
        name: str,
        code: str,
        type: OrgUnitType,
        parent_id: Optional[int] = None,
        sort_order: int = 0,
        leader_id: Optional[int] = None,
    ) -> Tuple[Optional[OrganizationUnit], Optional[str]]:
        """Create a new organization unit.

        Returns:
            Tuple of (organization_unit, error_message)
        """
        # Check if code already exists
        if repo.get_org_unit_by_code(db, code):
            return None, "组织编码已存在"

        # Check parent exists if provided
        if parent_id is not None:
            parent = repo.get_org_unit_by_id(db, parent_id)
            if not parent:
                return None, "父组织不存在"

            # Check max level
            level = int(parent.level) + 1
            if level >= OrgUnitService.MAX_LEVEL:
                return None, f"组织层级不能超过{OrgUnitService.MAX_LEVEL}级"

        # Check name uniqueness under same parent
        siblings = repo.get_children_units(db, parent_id) if parent_id else repo.get_root_units(db)
        for sibling in siblings:
            if sibling.name == name:
                return None, "同一父级下组织名称不能重复"

        unit = repo.create_org_unit(
            db,
            name=name,
            code=code,
            type=type,
            parent_id=parent_id,
            sort_order=sort_order,
            leader_id=leader_id,
        )
        return unit, None

    @staticmethod
    def update_org_unit(
        db,
        unit_id: int,
        name: Optional[str] = None,
        sort_order: Optional[int] = None,
        leader_id: Optional[int] = None,
    ) -> Tuple[Optional[OrganizationUnit], Optional[str]]:
        """Update organization unit.

        Returns:
            Tuple of (organization_unit, error_message)
        """
        unit = repo.get_org_unit_by_id(db, unit_id)
        if not unit:
            return None, "组织不存在"

        # Check name uniqueness under same parent if name is being updated
        if name is not None:
            siblings = (
                repo.get_children_units(db, int(unit.parent_id))
                if unit.parent_id is not None
                else repo.get_root_units(db)
            )
            for sibling in siblings:
                if sibling.id != unit_id and sibling.name == name:
                    return None, "同一父级下组织名称不能重复"

        updated = repo.update_org_unit(
            db,
            unit_id,
            name=name,
            sort_order=sort_order,
            leader_id=leader_id,
        )
        return updated, None

    @staticmethod
    def update_org_unit_status(
        db,
        unit_id: int,
        status: OrgUnitStatus,
    ) -> Tuple[Optional[OrganizationUnit], Optional[str]]:
        """Update organization unit status.

        Returns:
            Tuple of (organization_unit, error_message)
        """
        unit = repo.get_org_unit_by_id(db, unit_id)
        if not unit:
            return None, "组织不存在"

        if unit.status == status:
            return unit, None  # No change needed

        # Check if disabling (setting to inactive)
        if status == OrgUnitStatus.INACTIVE:
            from app.repositories import employee_repository as emp_repo

            # Check for workspaces - TODO: add workspace check when workspace module is implemented
            # Check for active employees
            all_unit_ids = repo.get_all_unit_ids(db, unit_id)
            if emp_repo.has_active_employees(db, all_unit_ids):
                return None, "该组织下存在有效员工，无法禁用"

        updated = repo.update_org_unit_status(db, unit_id, status)
        return updated, None

    @staticmethod
    def delete_org_unit(db, unit_id: int) -> Tuple[bool, Optional[str]]:
        """Delete organization unit.

        Returns:
            Tuple of (success, error_message)
        """
        unit = repo.get_org_unit_by_id(db, unit_id)
        if not unit:
            return False, "组织不存在"

        # Check for children
        if repo.has_children(db, unit_id):
            return False, "该组织下存在子组织，无法删除"

        # Check for employees
        all_unit_ids = repo.get_all_unit_ids(db, unit_id)
        from app.repositories import employee_repository as emp_repo

        if emp_repo.has_active_employees(db, all_unit_ids):
            return False, "该组织下存在有效员工，无法删除"

        # TODO: Check for workspaces when workspace module is implemented

        success = repo.delete_org_unit(db, unit_id)
        return success, None

    @staticmethod
    def can_delete(db, unit_id: int) -> Tuple[bool, Optional[str]]:
        """Check if organization unit can be deleted.

        Returns:
            Tuple of (can_delete, error_message)
        """
        unit = repo.get_org_unit_by_id(db, unit_id)
        if not unit:
            return False, "组织不存在"

        # Check for children
        if repo.has_children(db, unit_id):
            return False, "该组织下存在子组织"

        # Check for employees
        all_unit_ids = repo.get_all_unit_ids(db, unit_id)
        from app.repositories import employee_repository as emp_repo

        if emp_repo.has_active_employees(db, all_unit_ids):
            return False, "该组织下存在有效员工"

        # TODO: Check for workspaces when workspace module is implemented

        return True, None


org_unit_service = OrgUnitService()
