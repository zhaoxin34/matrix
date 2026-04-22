"""OrganizationUnit model."""

import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrgUnitType(str, enum.Enum):
    company = "company"
    branch = "branch"
    department = "department"
    sub_department = "sub_department"


class OrgUnitStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class OrganizationUnit(Base):
    """Organization unit model."""

    __tablename__ = "organization_unit"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    type: Mapped[OrgUnitType] = mapped_column(Enum(OrgUnitType), nullable=False)
    parent_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("organization_unit.id"), nullable=True)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[OrgUnitStatus] = mapped_column(Enum(OrgUnitStatus), nullable=False, default=OrgUnitStatus.active)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    leader_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    children: Mapped[list["OrganizationUnit"]] = relationship(
        "OrganizationUnit", back_populates="parent", foreign_keys=[parent_id]
    )
    parent: Mapped["OrganizationUnit | None"] = relationship(
        "OrganizationUnit", back_populates="children", remote_side="OrganizationUnit.id", foreign_keys=[parent_id]
    )
    employees: Mapped[list["Employee"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "Employee", back_populates="primary_unit", foreign_keys="Employee.primary_unit_id"
    )
