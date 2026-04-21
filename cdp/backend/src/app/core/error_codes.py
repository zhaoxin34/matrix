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

# 用户相关错误 (2000-2999)
ERR_USER_NOT_FOUND = 2001
ERR_USER_ALREADY_EXISTS = 2002
ERR_USER_DISABLED = 2003
ERR_USER_PASSWORD_MISMATCH = 2004

# 验证码错误 (3000-3999)
ERR_SMS_CODE_EXPIRED = 3001
ERR_SMS_CODE_INVALID = 3002
ERR_SMS_CODE_MISMATCH = 3003

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
    }
    return messages.get(code, "Unknown error")
