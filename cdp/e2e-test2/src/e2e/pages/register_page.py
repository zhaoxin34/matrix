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
        # MUI TextField wraps input, so we need to locate the input inside
        return self.get_by_test_id("inp-reg-username").locator("input")

    @property
    def email_input(self) -> Locator:
        # MUI TextField wraps input, so we need to locate the input inside
        return self.get_by_test_id("inp-reg-email").locator("input")

    @property
    def phone_input(self) -> Locator:
        # MUI TextField wraps input, so we need to locate the input inside
        return self.get_by_test_id("inp-reg-phone").locator("input")

    @property
    def sms_code_input(self) -> Locator:
        # frontend2 doesn't have SMS code field, return invalid locator
        return self.page.locator("#non-existent-sms-code")

    @property
    def password_input(self) -> Locator:
        # MUI TextField wraps input, so we need to locate the input inside
        return self.get_by_test_id("inp-reg-password").locator("input")

    @property
    def confirm_password_input(self) -> Locator:
        # MUI TextField wraps input, so we need to locate the input inside
        return self.get_by_test_id("inp-reg-confirm-password").locator("input")

    @property
    def terms_checkbox(self) -> Locator:
        # frontend2 doesn't have terms checkbox
        return self.page.locator("#non-existent-terms-checkbox")

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
        # frontend2 doesn't have SMS code field
        self.password_input.fill(password)
        # frontend2 uses confirmPassword instead of SMS code
        self.confirm_password_input.fill(password)
        # frontend2 doesn't have terms checkbox
        return self

    def submit(self) -> "RegisterPage":
        """Submit the registration form."""
        self.submit_button.click()
        return self
