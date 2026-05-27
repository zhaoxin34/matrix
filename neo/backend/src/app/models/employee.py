"""Employee model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class EmployeeStatus(str, PyEnum):
    """Employee status."""

    ONBOARDING = "onboarding"  # 待入职
    ON_JOB = "on_job"  # 在职
    TRANSFERRING = "transferring"  # 调动中
    OFFBOARDING = "offboarding"  # 待离职


class Employee(Base):
    """Employee model.

    Represents an employee in the organization.

    Attributes:
        id: Primary key
        employee_no: Employee number (unique)
        name: Employee name
        phone: Phone number
        email: Email address
        position: Job position/title
        primary_unit_id: Primary organization unit ID
        status: Employee status (onboarding/on_job/transferring/offboarding)
        entry_date: Entry date
        dimission_date: Dimission date
        is_deleted: Soft delete flag
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "employee"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_no = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    primary_unit_id = Column(
        Integer,
        ForeignKey("organization_unit.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    status = Column(
        Enum(EmployeeStatus),
        nullable=False,
        default=EmployeeStatus.ONBOARDING,
    )
    entry_date = Column(Date, nullable=True)
    dimission_date = Column(Date, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    primary_unit = relationship("OrganizationUnit", foreign_keys=[primary_unit_id])
    secondary_units = relationship(
        "EmployeeSecondaryUnit",
        back_populates="employee",
        cascade="all, delete-orphan",
    )
    transfers = relationship(
        "EmployeeTransfer",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_employee_name", "name"),
        Index("idx_employee_status", "status"),
        Index("idx_employee_deleted", "is_deleted"),
        Index("idx_employee_unit_status", "primary_unit_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Employee(id={self.id}, name={self.name}, employee_no={self.employee_no})>"
