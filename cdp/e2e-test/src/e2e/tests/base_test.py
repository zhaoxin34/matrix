"""
Base Test Classes for E2E Tests
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage


# Test credentials - use environment variables in production
TEST_PHONE = "13800138002"
TEST_PASSWORD = "abcd1234"

# Standard wait times (milliseconds)
LOGIN_WAIT_MS = 2000
MODAL_WAIT_MS = 1000
NAVIGATION_WAIT_MS = 1000


class BaseTestCase:
    """Base test class with common login and setup."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)
        self.org_structure_page = OrgStructurePage(page)

    def _login(self, phone: str = TEST_PHONE, password: str = TEST_PASSWORD):
        """Helper method to login before tests."""
        self.login_page.navigate()
        self.login_page.login(phone, password)
        self.page.wait_for_timeout(LOGIN_WAIT_MS)


# Common assertion helpers
EMPLOYEE_TABLE_HEADERS = ["工号", "姓名", "手机号", "邮箱", "职位", "状态", "操作"]
STAT_CARD_LABELS = ["组织单元", "员工总数", "在职", "入职中"]


def assert_employee_table_headers(page: Page):
    """Assert all employee table headers are visible."""
    for header in EMPLOYEE_TABLE_HEADERS:
        expect(page.get_by_role("columnheader", name=header)).to_be_visible()


def assert_stat_cards(page: Page):
    """Assert all stat cards are visible."""
    for label in STAT_CARD_LABELS:
        expect(page.locator(f"p:has-text('{label}')")).to_be_visible()