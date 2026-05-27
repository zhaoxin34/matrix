"""Register page object model."""

from playwright.sync_api import Page


class RegisterPage:
    """Register page object model."""

    def __init__(self, page: Page):
        self.page = page
        # 输入框 - 使用更通用的选择器
        self.phone_input = page.get_by_placeholder("手机号")
        self.username_input = page.get_by_placeholder("用户名")
        self.password_input = page.get_by_placeholder("密码")
        self.confirm_password_input = page.get_by_placeholder("确认密码")
        self.verification_code_input = page.get_by_placeholder("验证码")
        # 按钮
        self.submit_button = page.get_by_role("button", name="注册")
        self.send_code_button = page.get_by_role("button", name="发送验证码")
        # 链接
        self.login_link = page.get_by_role("link", name="立即登录")
        self.register_title = page.get_by_role("heading", name="注册")

    def navigate(self):
        """Navigate to register page."""
        self.page.goto("/register")
        self.page.wait_for_load_state("networkidle")

    def fill_register_form(self, phone: str, username: str, password: str, code: str = "123456"):
        """Fill the register form."""
        self.phone_input.fill(phone)
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.confirm_password_input.fill(password)
        self.verification_code_input.fill(code)

    def submit(self):
        """Submit the register form."""
        self.submit_button.click()
