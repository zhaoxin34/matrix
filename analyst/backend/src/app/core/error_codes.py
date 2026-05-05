"""Error codes for analyst backend."""

# Error code ranges:
# 0         - Success
# 1000-1999 - General errors
# 2000-2999 - Session errors
# 3000-3999 - User event errors
# 9000-9999 - System errors

ERROR_CODE_SUCCESS = 0
ERROR_CODE_INVALID_PARAMETER = 1001
ERROR_CODE_INTERNAL_ERROR = 9001
ERROR_CODE_SESSION_NOT_FOUND = 2001
ERROR_CODE_SESSION_EXPIRED = 2002
ERROR_CODE_INVALID_STATE_TRANSITION = 3001
