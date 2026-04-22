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
        return self.get_by_test_id("inp-reg-username")

    @property
    def email_input(self) -> Locator:
        return self.get_by_test_id("inp-reg-email")

    @property
    def phone_input(self) -> Locator:
        return self.get_by_test_id("inp-reg-phone")

    @property
    def sms_code_input(self) -> Locator:
        return self.get_by_test_id("inp-reg-sms-code")

    @property
    def password_input(self) -> Locator:
        return self.get_by_test_id("inp-reg-password")

    @property
    def terms_checkbox(self) -> Locator:
        return self.get_by_test_id("cb-reg-terms")

    @property
    def submit_button(self) -> Locator:
        return self.get_by_test_id("btn-reg-submit")

    @property
    def get_sms_code_button(self) -> Locator:
        return self.get_by_test_id("btn-reg-sms-send")

    @property
    def login_link(self) -> Locator:
        return self.page.get_by_role("link", name="立即登录")

    def fill_form(
        self,
        username: str,
        email: str,
        phone: str,
        password: str,
        sms_code: str = "123456",
    ) -> "RegisterPage":
        """Fill the registration form."""
        self.username_input.fill(username)
        self.email_input.fill(email)
        self.phone_input.fill(phone)
        self.sms_code_input.fill(sms_code)
        self.password_input.fill(password)
        self.terms_checkbox.check()
        return self

    def submit(self) -> "RegisterPage":
        """Submit the registration form."""
        self.submit_button.click()
        return self
