"""权限服务 - 解析当前用户可访问的组织单元 ID 列表"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.org_unit_closure import OrgUnitClosure
from app.models.user import User


class OrgPermissionService:
    """
    组织权限服务。

    权限规则：
    - system_admin (is_admin=True): 可访问所有节点，返回 None 表示无过滤
    - 普通用户：通过员工所在部门解析可访问范围（当前简化实现：返回所有部门）
    """

    def __init__(self, db: Session):
        self.db = db

    def get_permitted_unit_ids(self, current_user: User) -> Optional[list[int]]:
        """
        返回当前用户可访问的组织单元 ID 列表。
        返回 None 表示无限制（system_admin）。
        """
        if current_user.is_admin:
            return None

        # 普通用户：查找其员工档案的所在部门及下级
        from app.models.employee import Employee
        from app.models.user_employee_mapping import UserEmployeeMapping

        mapping = (
            self.db.query(UserEmployeeMapping)
            .filter(UserEmployeeMapping.user_id == current_user.id)
            .first()
        )
        if not mapping:
            return []

        employee = (
            self.db.query(Employee)
            .filter(Employee.id == mapping.employee_id)
            .first()
        )
        if not employee or not employee.primary_unit_id:
            return []

        # 返回该员工主部门及其所有后代
        rows = (
            self.db.query(OrgUnitClosure.descendant_id)
            .filter(OrgUnitClosure.ancestor_id == employee.primary_unit_id)
            .all()
        )
        return [r[0] for r in rows]

    def can_manage_unit(self, current_user: User, unit_id: int) -> bool:
        """检查用户是否有权管理指定组织单元"""
        permitted = self.get_permitted_unit_ids(current_user)
        if permitted is None:
            return True
        return unit_id in permitted
