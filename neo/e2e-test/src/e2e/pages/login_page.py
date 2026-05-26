"""Login page object model."""

from playwright.sync_api import Page


class LoginPage:
    """Login page object model."""

    def __init__(self, page: Page):
        self.page = page
        # 输入框 - 使用更通用的选择器
        self.phone_input = page.get_by_placeholder("手机号")
        self.password_input = page.get_by_placeholder("密码")
        # 按钮
        self.submit_button = page.get_by_role("button", name="登录")
        # 链接
        self.forgot_password_link = page.get_by_role("link", name="忘记密码？")
        self.register_link = page.get_by_role("link", name="立即注册")
        self.login_title = page.get_by_role("heading", name="登录")

    def navigate(self):
        """Navigate to login page."""
        self.page.goto("/login")
        self.page.wait_for_load_state("networkidle")

    def fill_login_form(self, phone: str, password: str):
        """Fill the login form."""
        self.phone_input.fill(phone)
        self.password_input.fill(password)

    def submit(self):
        """Submit the login form."""
        self.submit_button.click()
