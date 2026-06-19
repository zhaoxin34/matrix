"""E2E tests for the recording segment comment (annotation) feature.

These tests cover the user-visible flows of the annotation UI on the
playback page. They depend on:

  - A running Neo frontend on http://localhost:3000
  - A running Neo backend on http://localhost:8000
  - A pre-existing recording with at least one segment

Run with:

    cd e2e-test
    make test          # fast scenarios
    make test-slow     # scenarios that exercise actual playback for several seconds

NOTE: Full E2E coverage requires:
  1. A Page Object for the recording-playback page (RecordingPlaybackPage) —
     to be created; tracks the [+ 标注] button, sidebar segment cards,
     canvas overlay, and dialog.
  2. A fixture recording (with rrweb events uploaded to S3 + DB) — to be
     set up by a one-off fixture script that uses the Agent Steer recorder.
  3. A fixture workspace with two users (creator + non-creator) — to verify
     the permission model end-to-end.

The scenarios below are documented and skipped until those fixtures exist.
This file serves as a living spec for the E2E scenarios that must pass
before archive can be claimed fully verified.
"""

from __future__ import annotations

import pytest

from src.e2e.pages import LoginPage


# Standard test credentials (matches login_page fixtures).
TEST_PHONE = "13800138002"
TEST_PASSWORD = "abcd1234"


class TestRecordingAnnotationEntry:
    """Verify the annotation entry points exist on the playback page.

    Scenarios: when a user opens the playback page, they should see the
    [ + 标注 ] button in the control bar and the Segments sidebar.
    """

    def test_playback_page_loads_with_segments(self, page):
        """Navigate to a known recording's playback page and verify segments render."""
        login = LoginPage(page)
        login.login(phone=TEST_PHONE, password=TEST_PASSWORD)

        test_recording_url = self._get_test_recording_url()
        if not test_recording_url:
            pytest.skip("No test recording available — see e2e-test/README.md")

        page.goto(test_recording_url)
        # TODO: assert [+ 标注] button visible, assert segment cards render.
        # Requires RecordingPlaybackPage page object (not yet created).

    def test_sidebar_segment_card_shows_comment_count_badge(self, page):
        """When a segment has comments, its card header shows a [N] badge."""
        login = LoginPage(page)
        login.login(phone=TEST_PHONE, password=TEST_PASSWORD)

        test_recording_url = self._get_test_recording_url_with_comments()
        if not test_recording_url:
            pytest.skip("No test recording with comments available")

        page.goto(test_recording_url)
        # TODO: expand the first segment, assert the [N] badge is rendered.

    @staticmethod
    def _get_test_recording_url() -> str | None:
        """Return URL of a test recording, or None to skip."""
        return None

    @staticmethod
    def _get_test_recording_url_with_comments() -> str | None:
        """Return URL of a test recording that already has comments, or None."""
        return None


@pytest.mark.slow
class TestRecordingAnnotationInteraction:
    """Slow tests exercising actual playback + annotation UI.

    Run with `make test-slow`. Skipped by default.
    """

    def test_create_comment_via_dialog(self, page):
        """Open [ + 标注 ] dialog, fill fields, save — comment appears in sidebar."""
        # TODO: Requires RecordingPlaybackPage + fixture recording with no comments.

    def test_hover_sidebar_highlights_canvas_overlay(self, page):
        """Side-panel comment hover drives canvas overlay highlight ring."""
        # TODO: Requires playback running + an active comment in time range.

    def test_jump_button_seeks_to_comment_show_time(self, page):
        """Clicking [ ▶ 跳转 ] seeks playback to the comment's show_time."""
        # TODO: Requires playback running + verify controller.getCurrentTime().

    def test_editor_role_cannot_see_others_delete_button(self, page):
        """Editor sees [ 删除 ] only on their own comments, not others'."""
        # TODO: Requires fixture with two users + comments by both.

    def test_workspace_owner_can_delete_any_comment(self, page):
        """Workspace Owner sees [ 删除 ] on every comment."""
        # TODO: Requires fixture with Owner user + comments by another user.

    def test_cross_segment_active_state_recomputes(self, page):
        """Active comment state correctly switches when crossing segment boundaries."""
        # TODO: Requires recording with segments + comments in each segment.


@pytest.mark.slow
class TestRecordingAnnotationPerformance:
    """Performance & regression."""

    def test_playback_fps_holds_with_100_annotations(self, page):
        """With 100 annotations on a recording, playback holds ≥ 50 FPS."""
        # TODO: Requires fixture recording with 100 comments + DevTools FPS trace.

    def test_regression_existing_playback_still_works(self, page):
        """Without any comments, the existing playback UI is unchanged."""
        # TODO: Visual regression check against a baseline screenshot.

    # ---- Shared helpers (to be filled in once fixtures exist) ----

    def _get_test_recording_url(self) -> str | None:
        """Return URL of a test recording, or None to skip."""
        return None

    def _get_test_recording_url_with_comments(self) -> str | None:
        """Return URL of a test recording that already has comments, or None."""
        return None
