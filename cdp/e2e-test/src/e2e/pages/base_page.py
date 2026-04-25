"""
Base Page Object Model
"""

import os

from playwright.sync_api import Page, Locator


def get_base_url() -> str:
    """Get base URL from environment variable.

    Note: .env is loaded by conftest.py at module level, so no need to reload.
    """
    return os.getenv("PLAYWRIGHT_BASE_URL", "http://localhost:3002")


class BasePage:
    """Base page object model with common functionality."""

    # Subclasses should set their own path, e.g., "/register"
    path: str = ""

    def __init__(self, page: Page):
        self.page = page
        self.base_url = get_base_url()

    @property
    def url(self) -> str:
        return f"{self.base_url}{self.path}"

    def navigate(self) -> "BasePage":
        """Navigate to the page."""
        self.page.goto(self.url)
        self.page.wait_for_load_state("networkidle")
        return self

    def get_error_message(self) -> str | None:
        """Get error message if any.

        Supports both MUI (.MuiFormHelperText-root.Mui-error) and
        Ant Design (.ant-form-item-explain-error) error formats.
        """
        # Try MUI first
        error_locator = self.page.locator(".MuiFormHelperText-root.Mui-error")
        if error_locator.count() > 0:
            return error_locator.first.text_content()
        # Fall back to Ant Design
        error_locator = self.page.locator(".ant-form-item-explain-error")
        if error_locator.count() > 0:
            return error_locator.first.text_content()
        return None

    def get_by_test_id(self, test_id: str) -> Locator:
        """Get element by test-id."""
        return self.page.get_by_test_id(test_id)
