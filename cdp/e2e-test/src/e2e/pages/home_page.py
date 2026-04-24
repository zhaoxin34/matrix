"""
Home Page Object Model
"""

from playwright.sync_api import Locator

from .base_page import BasePage


class HomePage(BasePage):
    """Home page object model."""

    path = "/"

    @property
    def login_link(self) -> Locator:
        # The link "user 登录" in the header
        return self.page.locator("a[href='/login']").first

    @property
    def register_link(self) -> Locator:
        # The link in header with href /register
        return self.page.locator("a[href='/register']").first

    @property
    def user_dropdown(self) -> Locator:
        # User dropdown shown when logged in (in sidebar footer)
        return self.get_by_test_id("sidebar-user-menu")
