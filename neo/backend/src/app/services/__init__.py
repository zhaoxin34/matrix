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
from app.services.recording_service import RecordingService
from app.services.sms_service import send_verification_code, verify_code
from app.services.user_service import (
    get_user,
    get_users,
    is_phone_exists,
    update_user,
    update_user_status,
)
from app.services.workspace_service import WorkspaceService, workspace_service

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
    # workspace_service
    "WorkspaceService",
    "workspace_service",
    # recording_service
    "RecordingService",
]
