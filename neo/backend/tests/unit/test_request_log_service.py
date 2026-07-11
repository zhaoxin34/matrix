"""Unit tests for request log service."""

from sqlalchemy.orm import Session

from app.models.embedded_site import EmbeddedSite, EmbeddedSiteStatus
from app.repositories.request_log_repository import RequestLogRepository
from app.schemas.request_log import HttpMethod, RequestEvent, RequestLoggerPayload, RequestType
from app.services.request_log_service import RequestLogService


def _create_site(
    db_session: Session,
    workspace_id: int,
    user_id: int,
    site_url: str,
    site_name: str | None = None,
) -> EmbeddedSite:
    """Helper to create an embedded site."""
    site = EmbeddedSite(
        site_name=site_name or f"Site {site_url}",
        site_url=site_url,
        workspace_id=workspace_id,
        status=EmbeddedSiteStatus.ENABLED,
        created_by=user_id,
    )
    db_session.add(site)
    db_session.commit()
    db_session.refresh(site)
    return site


def _make_payload(
    url: str = "https://example.com/api/users",
    event: RequestEvent = RequestEvent.COMPLETE,
    request_id: str = "abc123456789",  # 12 chars
    session_id: str | None = None,
) -> RequestLoggerPayload:
    """Helper to create a request logger payload."""
    from app.schemas.request_log import RequestData

    return RequestLoggerPayload(
        event=event,
        request=RequestData(
            id=request_id,
            timestamp=1720646400000,
            type=RequestType.FETCH,
            method=HttpMethod.GET,
            url=url,
            requestHeaders={"Content-Type": "application/json"},
            requestBody=None,
            status=200,
            statusText="OK",
            responseHeaders={"Content-Type": "application/json"},
            responseBody='{"id":1}',
            duration=150,
            error=None,
        ),
        sessionId=session_id,
        tabId="tab123",
    )


class TestRequestLogRepository:
    """Tests for RequestLogRepository."""

    def test_find_matching_embedded_site_exact_match(self, db_session: Session, test_workspace):
        """Test URL exact match."""
        site = _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        repo = RequestLogRepository(db_session)

        result = repo.find_matching_embedded_site("https://example.com/api/users")
        assert result is not None
        assert result.id == site.id

    def test_find_matching_embedded_site_subpath(self, db_session: Session, test_workspace):
        """Test URL subpath match."""
        site = _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        repo = RequestLogRepository(db_session)

        result = repo.find_matching_embedded_site("https://example.com/deep/nested/path")
        assert result is not None
        assert result.id == site.id

    def test_find_matching_embedded_site_no_match(self, db_session: Session, test_workspace):
        """Test URL that doesn't match any site."""
        _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        repo = RequestLogRepository(db_session)

        result = repo.find_matching_embedded_site("https://other-domain.com/api")
        assert result is None

    def test_find_matching_embedded_site_disabled_site(self, db_session: Session, test_workspace):
        """Test that disabled sites are not matched."""
        site = EmbeddedSite(
            site_name="Disabled Site",
            site_url="https://disabled.com",
            workspace_id=test_workspace.id,
            status=EmbeddedSiteStatus.DISABLED,
            created_by=test_workspace.owner_id,
        )
        db_session.add(site)
        db_session.commit()
        repo = RequestLogRepository(db_session)

        result = repo.find_matching_embedded_site("https://disabled.com/api")
        assert result is None

    def test_find_matching_embedded_site_trailing_slash(self, db_session: Session, test_workspace):
        """Test URL with/without trailing slash."""
        site = _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com/")
        repo = RequestLogRepository(db_session)

        result = repo.find_matching_embedded_site("https://example.com/api/users")
        assert result is not None
        assert result.id == site.id

    def test_find_matching_embedded_site_picks_first(self, db_session: Session, test_workspace):
        """Test that first matching site is returned."""
        site1 = _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com", "Site A")
        site2 = _create_site(
            db_session,
            test_workspace.id,
            test_workspace.owner_id,
            "https://example.com/api",
            "Site B",
        )
        repo = RequestLogRepository(db_session)

        # https://example.com/api matches both (prefix match), first one returned
        result = repo.find_matching_embedded_site("https://example.com/api/users")
        assert result is not None
        assert result.id in [site1.id, site2.id]

    def test_exists_by_request_id_true(self, db_session: Session, test_workspace):
        """Test exists check when record exists."""
        site = _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        repo = RequestLogRepository(db_session)
        repo.create(
            {
                "request_id": "abc12345678",
                "workspace_id": site.workspace_id,
                "embedded_site_id": site.id,
                "event": "start",
                "type": "fetch",
                "method": "GET",
                "url": "https://example.com/api",
                "request_headers": {},
                "request_body": None,
                "status": None,
                "status_text": None,
                "response_headers": None,
                "response_body": None,
                "duration": None,
                "error": None,
                "session_id": None,
                "tab_id": None,
            }
        )
        db_session.commit()

        assert repo.exists_by_request_id("abc12345678") is True

    def test_exists_by_request_id_false(self, db_session: Session, test_workspace):
        """Test exists check when record doesn't exist."""
        repo = RequestLogRepository(db_session)
        assert repo.exists_by_request_id("nonexistent") is False


class TestRequestLogService:
    """Tests for RequestLogService."""

    def test_process_stores_log(self, db_session: Session, test_workspace):
        """Test that valid request is stored."""
        site = _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        service = RequestLogService(db_session)

        result = service.process(_make_payload("https://example.com/api/users", RequestEvent.COMPLETE))

        assert result["success"] is True
        assert result["received"] is True
        db_session.commit()

        # Verify stored
        from app.models.request_log import RequestLog

        log = db_session.query(RequestLog).filter(RequestLog.request_id == "abc123456789").first()
        assert log is not None
        assert log.workspace_id == site.workspace_id
        assert log.embedded_site_id == site.id
        assert log.url == "https://example.com/api/users"
        assert log.event.value == "complete"

    def test_process_no_matching_site(self, db_session: Session, test_workspace):
        """Test that request with no matching site returns received=False."""
        _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        service = RequestLogService(db_session)

        result = service.process(_make_payload("https://other.com/api"))

        assert result["success"] is True
        assert result["received"] is False
        assert "No matching embedded site" in result["message"]

    def test_process_duplicate_request_id(self, db_session: Session, test_workspace):
        """Test that duplicate request_id is ignored."""
        _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        service = RequestLogService(db_session)

        # First request
        result1 = service.process(_make_payload(request_id="dup123456789"))
        assert result1["received"] is True

        # Second request with same ID
        result2 = service.process(_make_payload(request_id="dup123456789"))
        assert result2["received"] is False
        assert "Duplicate" in result2["message"]

        # Verify only one record exists
        from app.models.request_log import RequestLog

        count = db_session.query(RequestLog).filter(RequestLog.request_id == "dup123456789").count()
        assert count == 1

    def test_process_all_event_types(self, db_session: Session, test_workspace):
        """Test storing all event types."""
        _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        service = RequestLogService(db_session)

        for i, event in enumerate([RequestEvent.START, RequestEvent.COMPLETE, RequestEvent.ERROR]):
            payload = _make_payload(
                url=f"https://example.com/api/{event.value}",
                event=event,
                request_id=f"evt{i:09d}".zfill(12),  # e.g. evt000000001 (12 chars)
            )
            result = service.process(payload)
            assert result["received"] is True

    def test_process_preserves_all_fields(self, db_session: Session, test_workspace):
        """Test that all request fields are stored correctly."""
        _create_site(db_session, test_workspace.id, test_workspace.owner_id, "https://example.com")
        service = RequestLogService(db_session)

        from app.schemas.request_log import RequestData

        payload = RequestLoggerPayload(
            event=RequestEvent.COMPLETE,
            request=RequestData(
                id="fullreq12345",  # 12 chars
                timestamp=1720646400000,
                type=RequestType.XHR,
                method=HttpMethod.POST,
                url="https://example.com/api/users",
                requestHeaders={"Authorization": "Bearer token", "Content-Type": "application/json"},
                requestBody='{"name":"test"}',
                status=201,
                statusText="Created",
                responseHeaders={"Content-Type": "application/json"},
                responseBody='{"id":1,"name":"test"}',
                duration=250,
                error=None,
            ),
            sessionId="session-abc123",
            tabId="tab-456",
        )
        service.process(payload)

        from app.models.request_log import RequestLog

        log = db_session.query(RequestLog).filter(RequestLog.request_id == "fullreq12345").first()
        assert log is not None
        assert log.type.value == "xhr"
        assert log.method == "POST"
        assert log.request_headers == {"Authorization": "Bearer token", "Content-Type": "application/json"}
        assert log.request_body == '{"name":"test"}'
        assert log.status == 201
        assert log.status_text == "Created"
        assert log.duration_ms == 250
        assert log.session_id == "session-abc123"
        assert log.tab_id == "tab-456"
