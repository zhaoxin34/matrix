"""RequestLog service."""

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.repositories.request_log_repository import RequestLogRepository
from app.schemas.request_log import RequestLoggerPayload

logger = logging.getLogger(__name__)


class RequestLogService:
    """Service for request log operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repository = RequestLogRepository(db)

    def process(self, payload: RequestLoggerPayload) -> dict[str, Any]:
        """Process a request log payload from Chrome extension.

        Args:
            payload: The request logger payload

        Returns:
            dict with keys:
                - success: bool - whether the request was processed
                - received: bool - whether the log was stored
                - message: str - optional message
        """
        request = payload.request

        # Step 1: Match URL against embedded sites
        embedded_site = self.repository.find_matching_embedded_site(request.url)
        if embedded_site is None:
            logger.debug(f"Request URL does not match any embedded site: {request.url}")
            return {"success": True, "received": False, "message": "No matching embedded site"}

        # Step 2: Check for duplicate (idempotency)
        if self.repository.exists_by_request_id(request.id):
            logger.debug(f"Duplicate request_id ignored: {request.id}")
            return {"success": True, "received": False, "message": "Duplicate request_id"}

        # Step 3: Store the log
        try:
            self.repository.create(
                {
                    "request_id": request.id,
                    "workspace_id": embedded_site.workspace_id,
                    "embedded_site_id": embedded_site.id,
                    "event": payload.event.value.lower(),
                    "type": request.type.value.lower(),
                    "method": request.method.value,
                    "url": request.url,
                    "request_headers": request.requestHeaders,
                    "request_body": request.requestBody,
                    "status": request.status,
                    "status_text": request.statusText,
                    "response_headers": request.responseHeaders,
                    "response_body": request.responseBody,
                    "duration": request.duration,
                    "error": request.error,
                    "session_id": payload.sessionId,
                    "tab_id": payload.tabId,
                }
            )
            self.db.commit()
            logger.debug(f"Request log stored: {request.id} for site {embedded_site.id}")
            return {"success": True, "received": True}
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to store request log: {e}")
            return {"success": True, "received": False, "message": "Storage failed"}
