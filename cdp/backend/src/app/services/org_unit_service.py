"""组织单元业务逻辑服务"""

from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.org_unit import OrganizationUnit, OrgUnitStatus
from app.repositories.org_unit_repo import OrgUnitRepository
from app.schemas.org_unit import (
    OrgUnitCreate,
    OrgUnitMove,
    OrgUnitTreeNode,
    OrgUnitUpdate,
)


class OrgUnitService:
    """组织单元服务"""

    def __init__(self, db: Session, permitted_unit_ids: Optional[list[int]] = None):
        self.db = db
        self.repo = OrgUnitRepository(db, permitted_unit_ids)

    # ------------------------------------------------------------------ #
    # 查询
    # ------------------------------------------------------------------ #

    def get_unit(self, unit_id: int) -> OrganizationUnit:
        unit = self.repo.find_by_id(unit_id)
        if not unit:
            raise HTTPException(status_code=404, detail="组织单元不存在")
        return unit

    def get_tree(self) -> list[OrgUnitTreeNode]:
        """返回完整组织树（含 member_count 和 total_member_count）"""
        all_units = self.repo.find_all()
        unit_map: dict[int, OrgUnitTreeNode] = {}

        for u in all_units:
            node = OrgUnitTreeNode(
                id=u.id,
                name=u.name,
                code=u.code,
                type=u.type,
                parent_id=u.parent_id,
                level=u.level,
                status=u.status,
                sort_order=u.sort_order,
                leader_id=u.leader_id,
                member_count=self.repo.count_direct_employees(u.id),
                total_member_count=self.repo.count_total_employees(u.id),
            )
            unit_map[u.id] = node

        roots: list[OrgUnitTreeNode] = []
        for node in unit_map.values():
            if node.parent_id and node.parent_id in unit_map:
                unit_map[node.parent_id].children.append(node)
            elif node.parent_id is None:
                roots.append(node)

        # 对每层排序
        def sort_children(node: OrgUnitTreeNode) -> None:
            node.children.sort(key=lambda c: c.sort_order)
            for child in node.children:
                sort_children(child)

        roots.sort(key=lambda n: n.sort_order)
        for root in roots:
            sort_children(root)

        return roots

    # ------------------------------------------------------------------ #
    # 写操作
    # ------------------------------------------------------------------ #

    def create_unit(self, data: OrgUnitCreate) -> OrganizationUnit:
        # 检查 code 唯一
        if self.repo.find_by_code(data.code):
            raise HTTPException(status_code=400, detail=f"组织编码 {data.code!r} 已存在")

        # 确定 level
        if data.parent_id:
            parent = self.repo.find_by_id(data.parent_id)
            if not parent:
                raise HTTPException(status_code=404, detail="父节点不存在")
            level = parent.level + 1
        else:
            level = 1

        unit = OrganizationUnit(
            name=data.name,
            code=data.code,
            type=data.type,
            parent_id=data.parent_id,
            level=level,
            status=OrgUnitStatus.active,
            sort_order=data.sort_order,
            leader_id=data.leader_id,
        )
        return self.repo.create(unit)

    def update_unit(self, unit_id: int, data: OrgUnitUpdate) -> OrganizationUnit:
        unit = self.get_unit(unit_id)

        if data.code is not None and data.code != unit.code:
            existing = self.repo.find_by_code(data.code)
            if existing:
                raise HTTPException(status_code=400, detail=f"组织编码 {data.code!r} 已存在")
            unit.code = data.code

        if data.name is not None:
            unit.name = data.name
        if data.leader_id is not None:
            unit.leader_id = data.leader_id
        if data.sort_order is not None:
            unit.sort_order = data.sort_order
        if data.status is not None:
            unit.status = data.status

        return self.repo.update(unit)

    def delete_unit(self, unit_id: int) -> None:
        unit = self.get_unit(unit_id)

        # 有子节点不允许删除
        children = self.repo.find_children(unit_id)
        if children:
            raise HTTPException(status_code=400, detail="请先删除所有子节点")

        # 有员工不允许删除
        if self.repo.count_direct_employees(unit_id) > 0:
            raise HTTPException(status_code=400, detail="该部门下还有员工，不能删除")

        self.repo.delete(unit)

    def move_unit(self, unit_id: int, data: OrgUnitMove) -> OrganizationUnit:
        unit = self.get_unit(unit_id)
        new_parent_id = data.new_parent_id

        # 防止移动到自身或后代（循环引用）
        if new_parent_id is not None:
            if new_parent_id == unit_id:
                raise HTTPException(status_code=400, detail="不能将节点移动到自身")
            if self.repo.is_descendant(new_parent_id, unit_id):
                raise HTTPException(status_code=400, detail="不能将节点移动到其后代节点下（循环引用）")
            new_parent = self.repo.find_by_id(new_parent_id)
            if not new_parent:
                raise HTTPException(status_code=404, detail="目标父节点不存在")

        return self.repo.move_unit(unit, new_parent_id)

    def toggle_status(self, unit_id: int) -> OrganizationUnit:
        unit = self.get_unit(unit_id)
        unit.status = (
            OrgUnitStatus.inactive
            if unit.status == OrgUnitStatus.active
            else OrgUnitStatus.active
        )
        return self.repo.update(unit)
