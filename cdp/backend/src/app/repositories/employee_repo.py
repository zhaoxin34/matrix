"""员工仓库"""

from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.models.employee import Employee, EmployeeStatus
from app.models.employee_secondary_unit import EmployeeSecondaryUnit
from app.models.employee_transfer import EmployeeTransfer
from app.models.user_employee_mapping import UserEmployeeMapping


class EmployeeRepository:
    """员工数据访问层"""

    def __init__(self, db: Session, permitted_unit_ids: Optional[list[int]] = None):
        self.db = db
        self.permitted_unit_ids = permitted_unit_ids

    def _base_query(self):
        q = (
            self.db.query(Employee)
            .options(
                selectinload(Employee.secondary_units),
                selectinload(Employee.user_mapping),
            )
        )
        if self.permitted_unit_ids is not None:
            q = q.filter(Employee.primary_unit_id.in_(self.permitted_unit_ids))
        return q

    # ------------------------------------------------------------------ #
    # 查询
    # ------------------------------------------------------------------ #

    def find_by_id(self, employee_id: int) -> Optional[Employee]:
        return self._base_query().filter(Employee.id == employee_id).first()

    def find_by_employee_no(self, employee_no: str) -> Optional[Employee]:
        return self._base_query().filter(Employee.employee_no == employee_no).first()

    def find_by_unit_ids(
        self,
        unit_ids: list[int],
        status: Optional[EmployeeStatus] = None,
        keyword: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Employee], int]:
        q = self._base_query()
        if unit_ids:
            q = q.filter(Employee.primary_unit_id.in_(unit_ids))
        if status:
            q = q.filter(Employee.status == status)
        if keyword:
            q = q.filter(
                Employee.name.ilike(f"%{keyword}%")
                | Employee.employee_no.ilike(f"%{keyword}%")
                | Employee.phone.ilike(f"%{keyword}%")
            )
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def find_all_for_export(
        self,
        unit_ids: Optional[list[int]] = None,
        status: Optional[EmployeeStatus] = None,
    ) -> list[Employee]:
        q = self._base_query()
        if unit_ids:
            q = q.filter(Employee.primary_unit_id.in_(unit_ids))
        if status:
            q = q.filter(Employee.status == status)
        return q.all()

    def find_mapping_by_user_id(self, user_id: int) -> Optional[UserEmployeeMapping]:
        return (
            self.db.query(UserEmployeeMapping)
            .filter(UserEmployeeMapping.user_id == user_id)
            .first()
        )

    def find_mapping_by_employee_id(self, employee_id: int) -> Optional[UserEmployeeMapping]:
        return (
            self.db.query(UserEmployeeMapping)
            .filter(UserEmployeeMapping.employee_id == employee_id)
            .first()
        )

    # ------------------------------------------------------------------ #
    # 写操作 - 员工 CRUD
    # ------------------------------------------------------------------ #

    def create(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.flush()
        self.db.refresh(employee)
        return employee

    def update(self, employee: Employee) -> Employee:
        self.db.flush()
        self.db.refresh(employee)
        return employee

    def soft_delete(self, employee: Employee) -> Employee:
        """软删除：标记为离职"""
        employee.status = EmployeeStatus.offboarding
        self.db.flush()
        self.db.refresh(employee)
        return employee

    def commit(self) -> None:
        self.db.commit()

    # ------------------------------------------------------------------ #
    # 辅属部门管理
    # ------------------------------------------------------------------ #

    def set_secondary_units(self, employee: Employee, unit_ids: list[int]) -> Employee:
        """替换员工的辅属部门列表"""
        # 删除旧的辅属部门记录
        self.db.query(EmployeeSecondaryUnit).filter(
            EmployeeSecondaryUnit.employee_id == employee.id
        ).delete()
        self.db.flush()

        # 插入新的辅属部门记录
        for uid in unit_ids:
            self.db.add(EmployeeSecondaryUnit(employee_id=employee.id, unit_id=uid))

        self.db.flush()
        self.db.refresh(employee)
        return employee

    # ------------------------------------------------------------------ #
    # 调动操作
    # ------------------------------------------------------------------ #

    def create_transfer(self, transfer: EmployeeTransfer) -> EmployeeTransfer:
        self.db.add(transfer)
        self.db.flush()
        self.db.refresh(transfer)
        return transfer

    def find_transfers_by_employee(self, employee_id: int) -> list[EmployeeTransfer]:
        return (
            self.db.query(EmployeeTransfer)
            .filter(EmployeeTransfer.employee_id == employee_id)
            .order_by(EmployeeTransfer.created_at.desc())
            .all()
        )

    # ------------------------------------------------------------------ #
    # 账号绑定
    # ------------------------------------------------------------------ #

    def bind_user(self, employee_id: int, user_id: int) -> UserEmployeeMapping:
        mapping = UserEmployeeMapping(user_id=user_id, employee_id=employee_id)
        self.db.add(mapping)
        self.db.flush()
        self.db.refresh(mapping)
        return mapping

    def unbind_user(self, employee: Employee) -> None:
        self.db.query(UserEmployeeMapping).filter(
            UserEmployeeMapping.employee_id == employee.id
        ).delete()
        self.db.flush()

    def find_all_employee_nos(self) -> set[str]:
        """获取所有已存在的员工工号，用于批量导入去重"""
        rows = self.db.query(Employee.employee_no).all()
        return {r[0] for r in rows}
