"""
Login Page Object Model
"""

from playwright.sync_api import Locator

from .base_page import BasePage


class LoginPage(BasePage):
    """Login page object model."""

    path = "/login"

    @property
    def phone_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="手机号")

    @property
    def password_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="密码")

    @property
    def password_toggle(self) -> Locator:
        return self.page.get_by_role("button", name="visibility")

    @property
    def submit_button(self) -> Locator:
        return self.page.get_by_role("button", name="登录")

    @property
    def register_link(self) -> Locator:
        return self.page.get_by_role("link", name="立即注册")

    @property
    def forgot_password_link(self) -> Locator:
        return self.page.get_by_role("link", name="忘记密码？")

    def login(self, phone: str, password: str) -> "LoginPage":
        """Login with phone and password."""
        self.phone_input.fill(phone)
        self.password_input.fill(password)
        self.submit_button.click()
        return self
