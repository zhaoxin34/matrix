"""Logging middleware for request/response tracking."""

import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import get_logger, set_request_id


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware that logs request details and adds X-Request-ID header."""

    def __init__(self, app):
        super().__init__(app)
        self.logger = get_logger("app.middleware.logging")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process each request with logging and request ID tracking."""
        # Generate unique request ID
        request_id = str(uuid.uuid4())

        # Store request ID in request state for access in handlers
        request.state.request_id = request_id

        # Set request ID in context for logging
        set_request_id(request_id)

        # Get client info
        client_host = request.client.host if request.client else "unknown"

        # Log request start
        self.logger.info(
            f"HTTP request started | method={request.method} | path={request.url.path} | client={client_host}",
            extra={"event": "http.request.started"}
        )

        # Process request
        response = await call_next(request)

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

        # Log request completion
        self.logger.info(
            f"HTTP request completed | method={request.method} | path={request.url.path} | status={response.status_code}",
            extra={"event": "http.request.completed"}
        )

        return response
