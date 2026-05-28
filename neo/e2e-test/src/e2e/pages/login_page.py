"""
Login Page Object Model
"""

from .base_page import BasePage


class LoginPage(BasePage):
    """登录页面对象模型."""

    path = "/(auth)/login"

    @property
    def phone_input(self):
        """手机号输入框"""
        return self.page.get_by_placeholder("请输入手机号")

    @property
    def password_input(self):
        """密码输入框"""
        return self.page.get_by_placeholder("请输入密码")

    @property
    def submit_button(self):
        """登录按钮"""
        return self.page.get_by_role("button", name="登录")

    @property
    def error_message(self):
        """错误消息"""
        return self.page.locator("[data-testid='error-message'], .text-destructive")

    def login(self, phone: str, password: str) -> None:
        """执行登录操作"""
        self.phone_input.fill(phone)
        self.password_input.fill(password)
        self.submit_button.click()
        self.page.wait_for_load_state("networkidle")

    def is_logged_in(self) -> bool:
        """检查是否已登录"""
        try:
            # 检查是否跳转到首页或其他页面
            self.page.wait_for_url("**/(?!login)**", timeout=3000)
            return True
        except Exception:
            return False

    def get_error_message(self) -> str | None:
        """获取错误消息文本"""
        try:
            return self.error_message.text_content()
        except Exception:
            return None
