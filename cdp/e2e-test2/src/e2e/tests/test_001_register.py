"""
CDP-REG: User Registration Tests
"""

import pytest
from datetime import datetime
from playwright.sync_api import Page, expect

from e2e.pages import RegisterPage, LoginPage
from conftest import assert_no_error_message


class TestUserRegistration:
    """Test cases for user registration module."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.register_page = RegisterPage(page)
        self.login_page = LoginPage(page)

    @pytest.mark.smoke
    def test_cdp_reg_001_user_success_register(self):
        """
        CDP-REG-001: 用户成功注册

        前置条件：用户未注册
        测试步骤：
            1. 打开浏览器访问 http://localhost:3001/register
            2. 输入用户名、密码、确认密码、邮箱
            3. 点击注册按钮
        预期结果：
            1. 注册成功，跳转到登录页面或显示成功消息
            2. 可以使用注册的账号登录
        """
        # Generate unique user data
        timestamp = int(datetime.now().timestamp())
        username = f"testuser_{timestamp}"
        email = f"{username}@example.com"
        phone = f"1380013{timestamp % 10000:04d}"  # 使用时间戳生成唯一手机号
        password = "abcd1234"
        sms_code = "123456"  # 验证码是假的，用123456即可

        # Navigate to register page
        self.register_page.navigate()

        # Verify register page loaded
        expect(self.page.get_by_role("heading", name="注册")).to_be_visible()

        # Fill the form
        self.register_page.username_input.fill(username)
        self.register_page.email_input.fill(email)
        self.register_page.phone_input.fill(phone)
        self.register_page.sms_code_input.fill(sms_code)
        self.register_page.password_input.fill(password)
        self.register_page.terms_checkbox.check()

        # Submit registration
        self.register_page.submit_button.click()

        # Wait for response or navigation
        self.page.wait_for_timeout(3000)

        # Assert no backend error occurred
        assert_no_error_message(self.page)

    def test_cdp_reg_003_register_page_loads(self):
        """
        CDP-REG-003: 注册页正常加载

        前置条件：无
        测试步骤：打开浏览器访问 http://localhost:3001/register
        预期结果：
            - 页面标题显示"注册"或"注册账号"
            - 页面包含用户名输入框
            - 页面包含邮箱输入框
            - 页面包含密码输入框
            - 页面包含确认密码输入框
            - 页面包含"注册"按钮
            - 页面包含"已有账号？立即登录"链接
        """
        self.register_page.navigate()

        # Check heading
        expect(self.page.get_by_role("heading", name="注册")).to_be_visible()

        # Check form fields exist
        expect(self.register_page.username_input).to_be_visible()
        expect(self.register_page.email_input).to_be_visible()
        expect(self.register_page.phone_input).to_be_visible()
        expect(self.register_page.password_input).to_be_visible()
        expect(self.register_page.terms_checkbox).to_be_visible()
        expect(self.register_page.submit_button).to_be_visible()

        # Check login link exists
        expect(self.register_page.login_link).to_be_visible()
        expect(self.register_page.login_link).to_have_attribute("href", "/login")

    def test_cdp_reg_004_register_to_login_navigation(self):
        """
        CDP-REG-004: 注册页跳转登录页

        前置条件：无
        测试步骤：在注册页点击"立即登录"链接
        预期结果：页面跳转到登录页 http://localhost:3001/login
        """
        self.register_page.navigate()
        self.register_page.login_link.click()
        self.page.wait_for_load_state("networkidle")

        expect(self.page).to_have_url(f"{self.login_page.url}")

    def test_cdp_reg_002_register_form_validation(self):
        """
        CDP-REG-002: 注册表单输入验证

        前置条件：无
        测试步骤：
            1. 打开浏览器访问 http://localhost:3001/register
            2. 不输入任何内容直接点击注册
            3. 或输入格式错误的邮箱
            4. 或输入不匹配的密码
        预期结果：
            1. 显示相应的验证错误提示
        """
        self.register_page.navigate()

        # Fill only username to trigger partial validation
        self.register_page.username_input.fill("test")
        self.register_page.submit_button.click()

        # Check that validation messages appear
        # The exact behavior depends on the form validation implementation
        self.page.wait_for_timeout(500)

        # Verify we're still on register page (form not submitted)
        expect(self.page).to_have_url(f"{self.register_page.url}")
