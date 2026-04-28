"""错误码定义

遵循项目错误码体系：
- 0: 成功
- 1000-1999: 通用错误
- 2000-2999: 用户相关错误
- 9000-9999: 系统错误
"""

# 成功
ERR_OK = 0

# 通用错误 (1000-1999)
ERR_INVALID_PARAMETER = 1001
ERR_UNAUTHORIZED = 1002
ERR_FORBIDDEN = 1003
ERR_NOT_FOUND = 1004
ERR_INTERNAL_ERROR = 1005
ERR_BAD_REQUEST = 1006
ERR_CONFLICT = 1007

# 用户相关错误 (2000-2999)
ERR_USER_NOT_FOUND = 2001
ERR_USER_ALREADY_EXISTS = 2002
ERR_USER_DISABLED = 2003
ERR_USER_PASSWORD_MISMATCH = 2004

# 验证码错误 (3000-3999)
ERR_SMS_CODE_EXPIRED = 3001
ERR_SMS_CODE_INVALID = 3002
ERR_SMS_CODE_MISMATCH = 3003

# 项目相关错误 (4000-4999)
ERR_PROJECT_CODE_EXISTS = 4001
ERR_PROJECT_NOT_FOUND = 4002
ERR_PROJECT_MEMBER_NOT_FOUND = 4003
ERR_PROJECT_MEMBER_EXISTS = 4004
ERR_ORG_ASSOCIATION_EXISTS = 4005
ERR_ORG_ASSOCIATION_NOT_FOUND = 4006
ERR_ORG_NOT_FOUND = 4007
ERR_CANNOT_REMOVE_LAST_ADMIN = 4008
ERR_CANNOT_DEMOTE_LAST_ADMIN = 4009

# 系统错误 (9000-9999)
ERR_SYSTEM_ERROR = 9001
ERR_DATABASE_ERROR = 9002


def get_error_message(code: int) -> str:
    """获取错误码对应的默认消息"""
    messages = {
        ERR_OK: "ok",
        ERR_INVALID_PARAMETER: "Invalid Parameter",
        ERR_UNAUTHORIZED: "Unauthorized",
        ERR_FORBIDDEN: "Forbidden",
        ERR_NOT_FOUND: "Not Found",
        ERR_INTERNAL_ERROR: "Internal Server Error",
        ERR_USER_NOT_FOUND: "User not found",
        ERR_USER_ALREADY_EXISTS: "User already exists",
        ERR_USER_DISABLED: "User is disabled",
        ERR_USER_PASSWORD_MISMATCH: "Password mismatch",
        ERR_SMS_CODE_EXPIRED: "SMS code expired",
        ERR_SMS_CODE_INVALID: "Invalid SMS code",
        ERR_SMS_CODE_MISMATCH: "SMS code mismatch",
        ERR_SYSTEM_ERROR: "System error",
        ERR_DATABASE_ERROR: "Database error",
        # 项目相关错误 (4000-4999)
        ERR_PROJECT_CODE_EXISTS: "Project code already exists",
        ERR_PROJECT_NOT_FOUND: "Project not found",
        ERR_PROJECT_MEMBER_NOT_FOUND: "Project member not found",
        ERR_PROJECT_MEMBER_EXISTS: "User is already a project member",
        ERR_ORG_ASSOCIATION_EXISTS: "Organization already associated",
        ERR_ORG_ASSOCIATION_NOT_FOUND: "Organization association not found",
        ERR_ORG_NOT_FOUND: "Organization not found",
        ERR_CANNOT_REMOVE_LAST_ADMIN: "Cannot remove the last admin",
        ERR_CANNOT_DEMOTE_LAST_ADMIN: "Cannot demote the last admin",
    }
    return messages.get(code, "Unknown error")
