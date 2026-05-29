"""自定义异常和全局异常处理器"""

from enum import IntEnum

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from app.schemas.response import ApiResponse


class ErrorCode(IntEnum):
    """错误码定义"""

    OK = 0
    BAD_REQUEST = 1001
    UNAUTHORIZED = 1002
    FORBIDDEN = 1003
    NOT_FOUND = 2001
    CONFLICT = 3001
    INTERNAL_ERROR = 5001

    # 业务错误码
    CODE_CONFLICT = 4001
    VERSION_CONFLICT = 4002
    DRAFT_EMPTY = 4003
    INVALID_OPERATION = 4004
    PATH_CONFLICT = 4005


class BusinessException(Exception):
    """业务异常"""

    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """全局 HTTPException 处理器

    将所有 HTTPException 转换为统一的 ApiResponse 格式：
    {
        "code": <status_code 作为业务码>,
        "message": <detail>,
        "traceId": "",
        "timestamp": <毫秒时间戳>
    }
    """
    return JSONResponse(
        status_code=200,  # 始终返回 200，由 code 字段表达业务状态
        content=ApiResponse.error(
            code=exc.status_code,
            message=exc.detail,
        ).model_dump(exclude_none=True),
    )


async def business_exception_handler(request: Request, exc: BusinessException) -> JSONResponse:
    """全局 BusinessException 处理器

    将所有 BusinessException 转换为统一的 ApiResponse 格式：
    {
        "code": <业务错误码>,
        "message": <错误消息>,
        "traceId": "",
        "timestamp": <毫秒时间戳>
    }
    """
    # Map business error codes to HTTP status codes
    if exc.code == ErrorCode.NOT_FOUND:
        status_code = 404
    elif exc.code in (ErrorCode.UNAUTHORIZED, ErrorCode.FORBIDDEN):
        status_code = 403
    elif exc.code == ErrorCode.BAD_REQUEST:
        status_code = 400
    elif exc.code == ErrorCode.CONFLICT:
        status_code = 409
    else:
        status_code = 400

    return JSONResponse(
        status_code=status_code,
        content=ApiResponse.error(
            code=exc.code,
            message=exc.message,
        ).model_dump(exclude_none=True),
    )


def register_exception_handlers(app):
    """注册全局异常处理器到 FastAPI app"""
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(BusinessException, business_exception_handler)
