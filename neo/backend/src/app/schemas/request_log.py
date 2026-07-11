"""RequestLog schemas."""

from enum import Enum

from pydantic import BaseModel, Field


class RequestEvent(str, Enum):
    """Request event type."""

    START = "start"
    COMPLETE = "complete"
    ERROR = "error"


class RequestType(str, Enum):
    """Request type."""

    FETCH = "fetch"
    XHR = "xhr"


class HttpMethod(str, Enum):
    """HTTP methods."""

    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"


class RequestData(BaseModel):
    """Request data schema.

    Field names follow the Chrome extension's camelCase convention.
    """

    id: str = Field(..., description="Unique request ID")
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    type: RequestType = Field(..., alias="type", validation_alias="type")
    method: HttpMethod = Field(..., alias="method", validation_alias="method")
    url: str = Field(..., description="Full request URL")
    requestHeaders: dict[str, str] | None = Field(None, alias="requestHeaders", validation_alias="requestHeaders")
    requestBody: str | None = Field(None, alias="requestBody", validation_alias="requestBody")
    status: int | None = Field(None, alias="status", validation_alias="status")
    statusText: str | None = Field(None, alias="statusText", validation_alias="statusText")
    responseHeaders: dict[str, str] | None = Field(None, alias="responseHeaders", validation_alias="responseHeaders")
    responseBody: str | None = Field(None, alias="responseBody", validation_alias="responseBody")
    duration: int | None = Field(None, alias="duration", validation_alias="duration")
    error: str | None = Field(None, alias="error", validation_alias="error")

    model_config = {"populate_by_name": True}


class RequestLoggerPayload(BaseModel):
    """Request logger payload from Chrome extension.

    Field names follow the Chrome extension's camelCase convention.
    """

    event: RequestEvent = Field(..., alias="event", validation_alias="event")
    request: RequestData = Field(..., alias="request", validation_alias="request")
    sessionId: str | None = Field(None, alias="sessionId", validation_alias="sessionId")
    tabId: str | None = Field(None, alias="tabId", validation_alias="tabId")

    model_config = {"populate_by_name": True}


class RequestLoggerResponse(BaseModel):
    """Response schema for request logger endpoint."""

    success: bool = Field(..., description="Whether request was received")
    received: bool = Field(..., description="Whether request was stored")
    message: str | None = Field(None, description="Optional message")
