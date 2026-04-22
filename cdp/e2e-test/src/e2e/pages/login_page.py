"""
Login Page Object Model
"""
from playwright.sync_api import Locator

from .base_page import BasePage


class LoginPage(BasePage):
    """Login page object model."""

    path = "/login"

    @property
    def username_input(self) -> Locator:
        return self.get_by_test_id("inp-login-username")

    @property
    def password_input(self) -> Locator:
        return self.get_by_test_id("inp-login-password")

    @property
    def submit_button(self) -> Locator:
        return self.get_by_test_id("btn-login-submit")

    @property
    def register_link(self) -> Locator:
        return self.page.get_by_role("link", name="立即注册")

    def login(self, username: str, password: str) -> "LoginPage":
        """Login with username and password."""
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.submit_button.click()
        return self
