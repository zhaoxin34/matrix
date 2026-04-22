"""Employee model."""

import enum
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EmployeeStatus(str, enum.Enum):
    onboarding = "onboarding"
    on_job = "on_job"
    transferring = "transferring"
    offboarding = "offboarding"


class Employee(Base):
    """Employee model."""

    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    employee_no: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    position: Mapped[str | None] = mapped_column(String(100), nullable=True)
    primary_unit_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("organization_unit.id"), nullable=True, index=True
    )
    status: Mapped[EmployeeStatus] = mapped_column(
        Enum(EmployeeStatus), nullable=False, default=EmployeeStatus.onboarding
    )
    entry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    dimission_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    primary_unit: Mapped["OrganizationUnit | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "OrganizationUnit", back_populates="employees", foreign_keys=[primary_unit_id]
    )
    secondary_units: Mapped[list["EmployeeSecondaryUnit"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "EmployeeSecondaryUnit", back_populates="employee", cascade="all, delete-orphan"
    )
    transfers: Mapped[list["EmployeeTransfer"]] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "EmployeeTransfer",
        back_populates="employee",
        cascade="all, delete-orphan",
        foreign_keys="EmployeeTransfer.employee_id",
    )
    user_mapping: Mapped["UserEmployeeMapping | None"] = relationship(  # type: ignore[name-defined]  # noqa: F821
        "UserEmployeeMapping", back_populates="employee", uselist=False, cascade="all, delete-orphan"
    )
