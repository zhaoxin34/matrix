"""统一 API 响应格式"""

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一 API 响应格式

    遵循项目 API 规范：
    - code: 业务状态码（0 = 成功）
    - message: 给人类/AI 的错误说明
    - data: 返回数据
    - traceId: 请求链路ID
    - timestamp: 服务端时间戳（毫秒）
    """

    code: int = 0
    message: str = "ok"
    data: T | None = None
    traceId: str = ""
    timestamp: int = 0

    @classmethod
    def success(cls, data: T, traceId: str = "", message: str = "ok") -> "ApiResponse[T]":
        """成功响应"""
        from time import time
        return cls(
            code=0,
            message=message,
            data=data,
            traceId=traceId,
            timestamp=int(time() * 1000),
        )

    @classmethod
    def error(cls, code: int, message: str, traceId: str = "") -> "ApiResponse[None]":
        """错误响应"""
        from time import time
        return cls(
            code=code,
            message=message,
            data=None,
            traceId=traceId,
            timestamp=int(time() * 1000),
        )
