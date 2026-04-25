"""
Register Page Object Model
"""

from playwright.sync_api import Locator

from .base_page import BasePage


class RegisterPage(BasePage):
    """Register page object model."""

    path = "/register"

    @property
    def username_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="用户名")

    @property
    def email_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="邮箱")

    @property
    def phone_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="手机号")

    @property
    def password_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="密码（至少8位，需包含字母和数字）")

    @property
    def confirm_password_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="确认密码")

    @property
    def submit_button(self) -> Locator:
        return self.page.get_by_role("button", name="注册")

    @property
    def login_link(self) -> Locator:
        return self.page.get_by_role("link", name="立即登录")

    def register(
        self,
        username: str,
        email: str,
        phone: str,
        password: str,
        confirm_password: str,
    ) -> "RegisterPage":
        """Fill and submit registration form."""
        self.username_input.fill(username)
        self.email_input.fill(email)
        self.phone_input.fill(phone)
        self.password_input.fill(password)
        self.confirm_password_input.fill(confirm_password)
        self.submit_button.click()
        return self
