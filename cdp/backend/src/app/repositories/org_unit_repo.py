"""组织单元仓库 - 基于闭包表实现层级查询"""

from typing import Optional

from sqlalchemy import and_, delete, func
from sqlalchemy.orm import Session

from app.models.org_unit import OrganizationUnit
from app.models.org_unit_closure import OrgUnitClosure


class OrgUnitRepository:
    """组织单元数据访问层，使用闭包表维护层级关系"""

    def __init__(self, db: Session, permitted_unit_ids: Optional[list[int]] = None):
        self.db = db
        self.permitted_unit_ids = permitted_unit_ids

    def _apply_permission_filter(self, query):
        """注入权限过滤：若有 permitted_unit_ids，则只返回权限范围内的节点"""
        if self.permitted_unit_ids is not None:
            query = query.filter(OrganizationUnit.id.in_(self.permitted_unit_ids))
        return query

    # ------------------------------------------------------------------ #
    # 查询
    # ------------------------------------------------------------------ #

    def find_by_id(self, unit_id: int) -> Optional[OrganizationUnit]:
        q = self.db.query(OrganizationUnit).filter(OrganizationUnit.id == unit_id)
        q = self._apply_permission_filter(q)
        return q.first()

    def find_by_code(self, code: str) -> Optional[OrganizationUnit]:
        return self.db.query(OrganizationUnit).filter(OrganizationUnit.code == code).first()

    def find_all(self) -> list[OrganizationUnit]:
        q = self.db.query(OrganizationUnit).order_by(
            OrganizationUnit.level, OrganizationUnit.sort_order
        )
        q = self._apply_permission_filter(q)
        return q.all()

    def find_children(self, parent_id: Optional[int]) -> list[OrganizationUnit]:
        """直接子节点"""
        q = self.db.query(OrganizationUnit).filter(
            OrganizationUnit.parent_id == parent_id
        ).order_by(OrganizationUnit.sort_order)
        q = self._apply_permission_filter(q)
        return q.all()

    def find_descendants(self, ancestor_id: int, max_depth: Optional[int] = None) -> list[OrganizationUnit]:
        """闭包表查所有后代"""
        q = (
            self.db.query(OrganizationUnit)
            .join(OrgUnitClosure, OrgUnitClosure.descendant_id == OrganizationUnit.id)
            .filter(
                OrgUnitClosure.ancestor_id == ancestor_id,
                OrgUnitClosure.depth > 0,
            )
        )
        if max_depth is not None:
            q = q.filter(OrgUnitClosure.depth <= max_depth)
        q = self._apply_permission_filter(q)
        return q.order_by(OrgUnitClosure.depth, OrganizationUnit.sort_order).all()

    def find_ancestors(self, descendant_id: int) -> list[OrganizationUnit]:
        """闭包表查所有祖先"""
        return (
            self.db.query(OrganizationUnit)
            .join(OrgUnitClosure, OrgUnitClosure.ancestor_id == OrganizationUnit.id)
            .filter(
                OrgUnitClosure.descendant_id == descendant_id,
                OrgUnitClosure.depth > 0,
            )
            .order_by(OrgUnitClosure.depth.desc())
            .all()
        )

    def get_descendant_ids(self, ancestor_id: int) -> list[int]:
        """返回所有后代 id（含自身）"""
        rows = (
            self.db.query(OrgUnitClosure.descendant_id)
            .filter(OrgUnitClosure.ancestor_id == ancestor_id)
            .all()
        )
        return [r[0] for r in rows]

    def count_direct_employees(self, unit_id: int) -> int:
        """直属员工数（非软删除）"""
        from app.models.employee import Employee, EmployeeStatus
        return (
            self.db.query(func.count(Employee.id))
            .filter(
                Employee.primary_unit_id == unit_id,
                Employee.status != EmployeeStatus.offboarding,
            )
            .scalar()
            or 0
        )

    def count_total_employees(self, unit_id: int) -> int:
        """含下级的员工总数"""
        from app.models.employee import Employee, EmployeeStatus
        descendant_ids = self.get_descendant_ids(unit_id)
        return (
            self.db.query(func.count(Employee.id))
            .filter(
                Employee.primary_unit_id.in_(descendant_ids),
                Employee.status != EmployeeStatus.offboarding,
            )
            .scalar()
            or 0
        )

    # ------------------------------------------------------------------ #
    # 写操作
    # ------------------------------------------------------------------ #

    def create(self, unit: OrganizationUnit) -> OrganizationUnit:
        """创建组织单元并插入闭包表记录"""
        self.db.add(unit)
        self.db.flush()  # 获取自动生成的 id

        # 插入自身 → 自身（depth=0）
        self.db.add(OrgUnitClosure(ancestor_id=unit.id, descendant_id=unit.id, depth=0))

        # 插入所有祖先 → 新节点
        if unit.parent_id:
            ancestor_rows = (
                self.db.query(OrgUnitClosure)
                .filter(OrgUnitClosure.descendant_id == unit.parent_id)
                .all()
            )
            for row in ancestor_rows:
                self.db.add(
                    OrgUnitClosure(
                        ancestor_id=row.ancestor_id,
                        descendant_id=unit.id,
                        depth=row.depth + 1,
                    )
                )

        self.db.commit()
        self.db.refresh(unit)
        return unit

    def update(self, unit: OrganizationUnit) -> OrganizationUnit:
        self.db.commit()
        self.db.refresh(unit)
        return unit

    def delete(self, unit: OrganizationUnit) -> None:
        """删除节点时，同步删除闭包表中涉及该节点的所有记录"""
        unit_id = unit.id
        self.db.execute(
            delete(OrgUnitClosure).where(
                (OrgUnitClosure.descendant_id == unit_id)
                | (OrgUnitClosure.ancestor_id == unit_id)
            )
        )
        self.db.delete(unit)
        self.db.commit()

    def move_unit(self, unit: OrganizationUnit, new_parent_id: Optional[int]) -> OrganizationUnit:
        """
        移动组织节点到新父节点下，同步更新闭包表。

        步骤：
        1. 删除该节点子树与旧祖先之间的闭包记录
        2. 重新插入子树与新祖先之间的闭包记录
        3. 更新节点本身的 parent_id 和 level
        """
        subtree_ids = self.get_descendant_ids(unit.id)  # 含自身

        # Step 1: 删除子树与旧祖先的关联（排除子树内部的关联）
        self.db.execute(
            delete(OrgUnitClosure).where(
                and_(
                    OrgUnitClosure.descendant_id.in_(subtree_ids),
                    OrgUnitClosure.ancestor_id.notin_(subtree_ids),
                )
            )
        )
        self.db.flush()

        # Step 2: 插入子树与新祖先的关联
        if new_parent_id is not None:
            new_ancestors = (
                self.db.query(OrgUnitClosure)
                .filter(OrgUnitClosure.descendant_id == new_parent_id)
                .all()
            )
            # 同时获取子树内部的闭包记录
            subtree_closures = (
                self.db.query(OrgUnitClosure)
                .filter(
                    OrgUnitClosure.ancestor_id.in_(subtree_ids),
                    OrgUnitClosure.descendant_id.in_(subtree_ids),
                )
                .all()
            )
            new_rows: list[OrgUnitClosure] = []
            for anc_row in new_ancestors:
                for sub_row in subtree_closures:
                    if sub_row.ancestor_id == unit.id:
                        new_rows.append(
                            OrgUnitClosure(
                                ancestor_id=anc_row.ancestor_id,
                                descendant_id=sub_row.descendant_id,
                                depth=anc_row.depth + sub_row.depth + 1,
                            )
                        )
            for row in new_rows:
                self.db.add(row)

        # Step 3: 更新 parent_id 和 level
        old_level = unit.level
        new_level = 1  # root
        if new_parent_id is not None:
            parent = self.db.query(OrganizationUnit).filter(
                OrganizationUnit.id == new_parent_id
            ).first()
            new_level = (parent.level if parent else 0) + 1

        level_diff = new_level - old_level
        unit.parent_id = new_parent_id
        unit.level = new_level

        # 递归更新子树 level
        if level_diff != 0 and len(subtree_ids) > 1:
            children_ids = [sid for sid in subtree_ids if sid != unit.id]
            self.db.query(OrganizationUnit).filter(
                OrganizationUnit.id.in_(children_ids)
            ).update(
                {OrganizationUnit.level: OrganizationUnit.level + level_diff},
                synchronize_session="fetch",
            )

        self.db.commit()
        self.db.refresh(unit)
        return unit

    def is_descendant(self, potential_descendant_id: int, ancestor_id: int) -> bool:
        """检查 potential_descendant_id 是否是 ancestor_id 的后代（含自身）"""
        row = (
            self.db.query(OrgUnitClosure)
            .filter(
                OrgUnitClosure.ancestor_id == ancestor_id,
                OrgUnitClosure.descendant_id == potential_descendant_id,
            )
            .first()
        )
        return row is not None
