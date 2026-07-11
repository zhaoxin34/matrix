"""RequestLog repository."""

from typing import Any

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.embedded_site import EmbeddedSite, EmbeddedSiteStatus
from app.models.request_log import RequestLog, RequestLogEvent, RequestLogType


class RequestLogRepository:
    """Repository for request log database operations."""

    def __init__(self, session: Session):
        """Initialize repository with database session."""
        self.session = session

    def create(self, data: dict[str, Any]) -> RequestLog:
        """Create a new request log entry."""
        log = RequestLog(
            request_id=data["request_id"],
            workspace_id=data["workspace_id"],
            embedded_site_id=data["embedded_site_id"],
            event=RequestLogEvent(data["event"]),
            type=RequestLogType(data["type"]),
            method=data["method"],
            url=data["url"],
            request_headers=data.get("request_headers"),
            request_body=data.get("request_body"),
            status=data.get("status"),
            status_text=data.get("status_text"),
            response_headers=data.get("response_headers"),
            response_body=data.get("response_body"),
            duration_ms=data.get("duration"),
            error=data.get("error"),
            session_id=data.get("session_id"),
            tab_id=data.get("tab_id"),
        )
        self.session.add(log)
        self.session.flush()
        self.session.refresh(log)
        return log

    def exists_by_request_id(self, request_id: str) -> bool:
        """Check if a request log with the given request_id exists."""
        return self.session.query(RequestLog.id).filter(RequestLog.request_id == request_id).first() is not None

    def find_matching_embedded_site(self, url: str) -> EmbeddedSite | None:
        """Find the first enabled embedded site whose site_url is a prefix of the given URL.

        Matching logic:
        - Normalize both URLs (strip trailing slash)
        - Check if request URL starts with embedded site URL (allowing sub-paths)
        - Only match enabled sites
        """
        # Normalize URL for comparison
        normalized_url = url.rstrip("/")

        # Query all enabled embedded sites and check prefix match
        sites = (
            self.session.query(EmbeddedSite)
            .filter(
                and_(
                    EmbeddedSite.status == EmbeddedSiteStatus.ENABLED,
                    EmbeddedSite.deleted_at.is_(None),
                )
            )
            .all()
        )

        for site in sites:
            site_url = site.site_url.rstrip("/")
            # Check if request URL starts with site URL
            if normalized_url.startswith(site_url):
                return site

        return None
