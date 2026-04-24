"""自定义异常和全局异常处理器

将所有 HTTPException 转换为统一的 ApiResponse 格式
"""

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from app.schemas.response import ApiResponse


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


def register_exception_handlers(app):
    """注册全局异常处理器到 FastAPI app"""
    app.add_exception_handler(HTTPException, http_exception_handler)
