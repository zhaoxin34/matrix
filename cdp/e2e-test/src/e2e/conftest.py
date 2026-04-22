"""
CDP E2E Test Framework - Pytest Configuration
"""
import pytest
from playwright.sync_api import Page, Browser


@pytest.fixture
def page(context):
    """Create a new page for each test."""
    return context.new_page()


@pytest.fixture
def goto(page: Page):
    """Helper fixture to navigate to a URL."""
    def _goto(url: str):
        page.goto(url)
        page.wait_for_load_state("networkidle")
    return _goto
