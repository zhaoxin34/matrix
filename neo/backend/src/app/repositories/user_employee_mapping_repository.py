"""User Employee Mapping Repository."""

from sqlalchemy.orm import Session

from app.models import UserEmployeeMapping


class UserEmployeeMappingRepository:
    """Repository for UserEmployeeMapping operations."""

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> UserEmployeeMapping | None:
        """Get mapping by user ID."""
        return db.query(UserEmployeeMapping).filter(UserEmployeeMapping.user_id == user_id).first()

    @staticmethod
    def get_by_employee_id(db: Session, employee_id: int) -> UserEmployeeMapping | None:
        """Get mapping by employee ID."""
        return db.query(UserEmployeeMapping).filter(UserEmployeeMapping.employee_id == employee_id).first()

    @staticmethod
    def is_user_linked(db: Session, user_id: int) -> bool:
        """Check if user is already linked to an employee."""
        return (db.query(UserEmployeeMapping).filter(UserEmployeeMapping.user_id == user_id).first()) is not None

    @staticmethod
    def is_employee_linked(db: Session, employee_id: int) -> bool:
        """Check if employee is already linked to a user."""
        return (
            db.query(UserEmployeeMapping).filter(UserEmployeeMapping.employee_id == employee_id).first()
        ) is not None

    @staticmethod
    def create(db: Session, user_id: int, employee_id: int) -> UserEmployeeMapping:
        """Create a new mapping."""
        mapping = UserEmployeeMapping(
            user_id=user_id,
            employee_id=employee_id,
        )
        db.add(mapping)
        db.commit()
        db.refresh(mapping)
        return mapping

    @staticmethod
    def delete_by_user_id(db: Session, user_id: int) -> bool:
        """Delete mapping by user ID."""
        mapping = UserEmployeeMappingRepository.get_by_user_id(db, user_id)
        if mapping:
            db.delete(mapping)
            db.commit()
            return True
        return False

    @staticmethod
    def delete_by_employee_id(db: Session, employee_id: int) -> bool:
        """Delete mapping by employee ID."""
        mapping = UserEmployeeMappingRepository.get_by_employee_id(db, employee_id)
        if mapping:
            db.delete(mapping)
            db.commit()
            return True
        return False

    @staticmethod
    def get_linked_user_ids(db: Session, limit: int = 1000) -> list[int]:
        """Get all user IDs that are linked to employees."""
        results = db.query(UserEmployeeMapping.user_id).limit(limit).all()
        return [r[0] for r in results]

    @staticmethod
    def get_linked_employee_ids(db: Session, limit: int = 1000) -> list[int]:
        """Get all employee IDs that are linked to users."""
        results = db.query(UserEmployeeMapping.employee_id).limit(limit).all()
        return [r[0] for r in results]


user_employee_mapping_repository = UserEmployeeMappingRepository()
