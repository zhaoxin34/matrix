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
        return self.get_by_test_id("link-home-login")

    @property
    def register_link(self) -> Locator:
        return self.get_by_test_id("link-home-register")

    @property
    def user_info_or_logout(self) -> Locator:
        # This could be either user info or logout button
        return self.page.get_by_role("button", name="退出").or_(
            self.page.get_by_text("user")
        )