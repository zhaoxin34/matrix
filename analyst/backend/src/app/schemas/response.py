"""Unified API response format."""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Unified API response format

    Following project API spec:
    - code: business status code (0 = success)
    - message: human/AI readable error description
    - data: returned data
    - traceId: request trace ID
    - timestamp: server timestamp (milliseconds)
    """

    code: int = 0
    message: str = "ok"
    data: T | None = None
    traceId: str = ""
    timestamp: int = 0

    @classmethod
    def success(cls, data: T, traceId: str = "", message: str = "ok") -> "ApiResponse[T]":
        """Success response"""
        from time import time

        return cls(
            code=0,
            message=message,
            data=data,
            traceId=traceId,
            timestamp=int(time() * 1000),
        )

    @classmethod
    def error(cls, code: int, message: str, traceId: str = "") -> "ApiResponse[T]":
        """Error response"""
        from time import time

        return cls(
            code=code,
            message=message,
            data=None,
            traceId=traceId,
            timestamp=int(time() * 1000),
        )
