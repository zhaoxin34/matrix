"""错误码定义

遵循项目错误码体系：
- 0: 成功
- 1000-1999: 通用错误
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

# Agent 错误 (2000-2099)
ERR_AGENT_NOT_FOUND = 2001
ERR_AGENT_NAME_EXISTS = 2002
ERR_AGENT_STATUS_NOT_ALLOWED = 2003
ERR_AGENT_HAS_ACTIVE_TASKS = 2004

# Agent Prototype 错误 (2010-2019)
ERR_PROTOTYPE_NOT_FOUND = 2011
ERR_PROTOTYPE_NOT_ENABLED = 2012
ERR_PROTOTYPE_VERSION_NOT_FOUND = 2013

# 工作区错误 (3000-3099)
ERR_WORKSPACE_NOT_FOUND = 3001

# Task 错误 (3010-3099)
ERR_TASK_NOT_FOUND = 3022
ERR_TASK_INVALID_TYPE = 3005
ERR_TASK_HAS_RECORDS = 3006
ERR_TASK_RUNNING = 3004
ERR_TASK_ALREADY_ENABLED = 3007
ERR_TASK_ALREADY_DISABLED = 3008
ERR_TASK_ALREADY_SUCCEEDED = 3009
ERR_TASK_INVALID_CRON = 3031

# 嵌入网站错误 (4000-4099)
ERR_EMBEDDED_SITE_NOT_FOUND = 4001
ERR_EMBEDDED_SITE_DUPLICATE_NAME = 4002
ERR_EMBEDDED_SITE_LINKED_AGENTS = 4003

# 用户与员工映射错误 (2000-2099)
ERR_USER_ALREADY_LINKED = 2001
ERR_USER_NOT_LINKED = 2002
ERR_PHONE_MISMATCH = 2003

# Recording Segment Comment 错误 (5000-5099)
ERR_RECORDING_SEGMENT_COMMENT_NOT_FOUND = 5001
ERR_RECORDING_SEGMENT_COMMENT_INVALID_TIME_RANGE = 5002
ERR_RECORDING_SEGMENT_COMMENT_ABSTRACT_TOO_LONG = 5003
ERR_RECORDING_SEGMENT_COMMENT_CONTENT_TOO_LONG = 5004

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
        ERR_BAD_REQUEST: "Bad Request",
        ERR_CONFLICT: "Conflict",
        ERR_AGENT_NOT_FOUND: "Agent not found",
        ERR_AGENT_NAME_EXISTS: "Agent name already exists in this workspace",
        ERR_AGENT_STATUS_NOT_ALLOWED: "Agent status does not allow this operation",
        ERR_AGENT_HAS_ACTIVE_TASKS: "Cannot delete Agent with active tasks",
        ERR_PROTOTYPE_NOT_FOUND: "Prototype not found",
        ERR_PROTOTYPE_NOT_ENABLED: "Prototype must be enabled",
        ERR_PROTOTYPE_VERSION_NOT_FOUND: "Prototype version not found",
        ERR_USER_ALREADY_LINKED: "用户已被其他员工关联",
        ERR_USER_NOT_LINKED: "用户未关联员工",
        ERR_PHONE_MISMATCH: "手机号必须与用户手机号一致",
        ERR_RECORDING_SEGMENT_COMMENT_NOT_FOUND: "Recording segment comment not found",
        ERR_RECORDING_SEGMENT_COMMENT_INVALID_TIME_RANGE: "hide_time must be greater than show_time",
        ERR_RECORDING_SEGMENT_COMMENT_ABSTRACT_TOO_LONG: "Abstract exceeds 255 characters",
        ERR_RECORDING_SEGMENT_COMMENT_CONTENT_TOO_LONG: "Content exceeds 5000 characters",
        ERR_EMBEDDED_SITE_NOT_FOUND: "Embedded site not found",
        ERR_EMBEDDED_SITE_DUPLICATE_NAME: "Site name already exists in workspace",
        ERR_EMBEDDED_SITE_LINKED_AGENTS: "Cannot delete site with linked agents",
        ERR_TASK_NOT_FOUND: "Task not found",
        ERR_TASK_INVALID_TYPE: "Operation not allowed for this task type",
        ERR_TASK_HAS_RECORDS: "Cannot delete task with execution records",
        ERR_TASK_RUNNING: "Cannot modify a running task",
        ERR_TASK_ALREADY_ENABLED: "Task is already enabled",
        ERR_TASK_ALREADY_DISABLED: "Task is already disabled",
        ERR_TASK_ALREADY_SUCCEEDED: "Task has already succeeded",
        ERR_TASK_INVALID_CRON: "Invalid cron expression format",
        ERR_SYSTEM_ERROR: "System error",
        ERR_DATABASE_ERROR: "Database error",
    }
    return messages.get(code, "Unknown error")
