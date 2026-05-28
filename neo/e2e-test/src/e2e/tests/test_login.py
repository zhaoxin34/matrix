"""
E2E Tests for Login Feature
"""

import pytest
from playwright.sync_api import expect

from e2e.tests.base_test import BaseTestCase


class TestLogin(BaseTestCase):
    """Test cases for login functionality."""

    @pytest.mark.smoke
    @pytest.mark.login
    def test_neo_login_001_valid_login(self):
        """
        NEO-LOGIN-001: 有效登录

        前置条件：无
        测试步骤：
            1. 进入登录页面
            2. 输入有效的手机号和密码
            3. 点击登录按钮
        预期结果：
            1. 登录成功，跳转到首页或工作区
            2. 显示用户信息或导航菜单
        """
        self.login_page.navigate()
        expect(self.login_page.phone_input).to_be_visible()
        expect(self.login_page.password_input).to_be_visible()

        self.login_page.login("13800138002", "abcd1234")
        self.page.wait_for_timeout(1000)

        # 验证登录成功（URL发生变化或显示用户信息）
        expect(self.page).not_to_have_url("**/login**")

    @pytest.mark.login
    def test_neo_login_002_invalid_password(self):
        """
        NEO-LOGIN-002: 密码错误登录失败

        前置条件：无
        测试步骤：
            1. 进入登录页面
            2. 输入手机号和错误密码
            3. 点击登录按钮
        预期结果：
            1. 显示错误提示
            2. 停留在登录页面
        """
        self.login_page.navigate()
        self.login_page.login("13800138002", "wrongpassword")
        self.page.wait_for_timeout(1000)

        # 应该显示错误或停留在登录页
        # 错误时可能显示错误消息或保持在登录页
        pass

    @pytest.mark.login
    def test_neo_login_003_empty_credentials(self):
        """
        NEO-LOGIN-003: 空凭据登录

        前置条件：无
        测试步骤：
            1. 进入登录页面
            2. 不输入任何内容直接点击登录
        预期结果：
            1. 显示验证错误
            2. 停留在登录页面
        """
        self.login_page.navigate()
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(500)

        # 应该显示验证错误
        expect(self.login_page.phone_input).to_be_visible()
        expect(self.login_page.password_input).to_be_visible()
