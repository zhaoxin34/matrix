"""Organization Unit repository."""

from sqlalchemy.orm import Session

from app.models import OrganizationUnit, OrgUnitClosure, OrgUnitStatus, OrgUnitType


def get_org_unit_by_id(db: Session, unit_id: int) -> OrganizationUnit | None:
    """Get organization unit by ID."""
    return db.query(OrganizationUnit).filter(OrganizationUnit.id == unit_id).first()


def get_org_unit_by_code(db: Session, code: str) -> OrganizationUnit | None:
    """Get organization unit by code."""
    return db.query(OrganizationUnit).filter(OrganizationUnit.code == code).first()


def get_org_units(
    db: Session,
    status: OrgUnitStatus | None = None,
) -> list[OrganizationUnit]:
    """Get all organization units, optionally filtered by status."""
    query = db.query(OrganizationUnit)
    if status:
        query = query.filter(OrganizationUnit.status == status)
    return query.order_by(OrganizationUnit.level, OrganizationUnit.sort_order).all()


def get_org_unit_tree(
    db: Session,
    status: OrgUnitStatus | None = None,
) -> list[OrganizationUnit]:
    """Get organization units as a tree structure."""
    query = db.query(OrganizationUnit)
    if status:
        query = query.filter(OrganizationUnit.status == status)
    units = query.order_by(OrganizationUnit.level, OrganizationUnit.sort_order).all()

    # Build tree structure
    children_map: dict[int, list[OrganizationUnit]] = {}

    for unit in units:
        children_map.setdefault(unit.parent_id, []).append(unit)

    def get_children(parent_id: int | None) -> list[OrganizationUnit]:
        return children_map.get(parent_id, [])

    return units


def get_root_units(db: Session, status: OrgUnitStatus | None = None) -> list[OrganizationUnit]:
    """Get root organization units (parent_id is null)."""
    query = db.query(OrganizationUnit).filter(OrganizationUnit.parent_id.is_(None))
    if status:
        query = query.filter(OrganizationUnit.status == status)
    return query.order_by(OrganizationUnit.sort_order).all()


def get_children_units(db: Session, parent_id: int) -> list[OrganizationUnit]:
    """Get child organization units."""
    return (
        db.query(OrganizationUnit)
        .filter(OrganizationUnit.parent_id == parent_id)
        .order_by(OrganizationUnit.sort_order)
        .all()
    )


def has_children(db: Session, unit_id: int) -> bool:
    """Check if organization unit has children."""
    return db.query(OrganizationUnit).filter(OrganizationUnit.parent_id == unit_id).count() > 0


def get_level(db: Session, parent_id: int | None) -> int:
    """Get the level of a new unit based on parent."""
    if parent_id is None:
        return 0
    parent = get_org_unit_by_id(db, parent_id)
    if not parent:
        return 0
    return parent.level + 1


def create_org_unit(
    db: Session,
    name: str,
    code: str,
    type: OrgUnitType,
    parent_id: int | None = None,
    sort_order: int = 0,
    leader_id: int | None = None,
) -> OrganizationUnit:
    """Create a new organization unit."""
    level = get_level(db, parent_id)

    unit = OrganizationUnit(
        name=name,
        code=code,
        type=type,
        parent_id=parent_id,
        level=level,
        sort_order=sort_order,
        leader_id=leader_id,
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)

    # Add closure records
    _add_closure_records(db, unit.id, parent_id, level)

    return unit


def _add_closure_records(db: Session, unit_id: int, parent_id: int | None, level: int) -> None:
    """Add closure records for a new organization unit."""
    # Self reference
    closure_self = OrgUnitClosure(ancestor_id=unit_id, descendant_id=unit_id, depth=0)
    db.add(closure_self)

    # Copy ancestor closures from parent
    if parent_id is not None:
        parent_closures = db.query(OrgUnitClosure).filter(OrgUnitClosure.descendant_id == parent_id).all()
        for closure in parent_closures:
            new_closure = OrgUnitClosure(
                ancestor_id=closure.ancestor_id,
                descendant_id=unit_id,
                depth=closure.depth + 1,
            )
            db.add(new_closure)

    db.commit()


def update_org_unit(
    db: Session,
    unit_id: int,
    name: str | None = None,
    sort_order: int | None = None,
    leader_id: int | None = None,
) -> OrganizationUnit | None:
    """Update organization unit."""
    unit = get_org_unit_by_id(db, unit_id)
    if not unit:
        return None

    if name is not None:
        unit.name = name
    if sort_order is not None:
        unit.sort_order = sort_order
    if leader_id is not None:
        unit.leader_id = leader_id

    db.commit()
    db.refresh(unit)
    return unit


def update_org_unit_status(
    db: Session,
    unit_id: int,
    status: OrgUnitStatus,
) -> OrganizationUnit | None:
    """Update organization unit status."""
    unit = get_org_unit_by_id(db, unit_id)
    if not unit:
        return None

    unit.status = status
    db.commit()
    db.refresh(unit)
    return unit


def delete_org_unit(db: Session, unit_id: int) -> bool:
    """Delete organization unit."""
    unit = get_org_unit_by_id(db, unit_id)
    if not unit:
        return False

    # Delete closure records
    db.query(OrgUnitClosure).filter(
        (OrgUnitClosure.ancestor_id == unit_id) | (OrgUnitClosure.descendant_id == unit_id),
    ).delete()

    db.delete(unit)
    db.commit()
    return True


def get_descendants(db: Session, unit_id: int) -> list[int]:
    """Get all descendant unit IDs using closure table."""
    closures = (
        db.query(OrgUnitClosure.descendant_id)
        .filter(OrgUnitClosure.ancestor_id == unit_id, OrgUnitClosure.depth > 0)
        .all()
    )
    return [c[0] for c in closures]


def get_ancestors(db: Session, unit_id: int) -> list[int]:
    """Get all ancestor unit IDs using closure table."""
    closures = (
        db.query(OrgUnitClosure.ancestor_id)
        .filter(OrgUnitClosure.descendant_id == unit_id, OrgUnitClosure.depth > 0)
        .order_by(OrgUnitClosure.depth)
        .all()
    )
    return [c[0] for c in closures]


def get_all_unit_ids(db: Session, unit_id: int) -> list[int]:
    """Get unit_id plus all descendants."""
    descendants = get_descendants(db, unit_id)
    return [unit_id] + descendants
