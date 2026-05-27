"""Services package."""

from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_user_by_id,
    get_user_by_phone,
    hash_password,
    verify_password,
)
from app.services.employee_service import EmployeeService, employee_service
from app.services.org_unit_service import OrgUnitService, org_unit_service
from app.services.sms_service import send_verification_code, verify_code
from app.services.user_service import (
    get_user,
    get_users,
    is_phone_exists,
    update_user,
    update_user_status,
)

__all__ = [
    # auth_service
    "authenticate_user",
    "create_user",
    "get_user_by_id",
    "get_user_by_phone",
    "hash_password",
    "verify_password",
    # employee_service
    "EmployeeService",
    "employee_service",
    # org_unit_service
    "OrgUnitService",
    "org_unit_service",
    # sms_service
    "send_verification_code",
    "verify_code",
    # user_service
    "get_user",
    "get_users",
    "is_phone_exists",
    "update_user",
    "update_user_status",
    "user_service",
]
