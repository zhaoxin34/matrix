"""
CDP-HOME: Home Page Tests
"""

import re
import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, HomePage


class TestHomePage:
    """Test cases for home page module."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)
        self.home_page = HomePage(page)

    def test_cdp_home_001_home_page_loads_correctly(self):
        """
        CDP-HOME-001: 首页正常加载

        前置条件：无
        测试步骤：打开浏览器访问 http://localhost:3002
        预期结果：
            - 页面正确加载
            - 显示平台名称或Logo
            - 导航栏显示主要菜单项
            - 页面包含核心功能入口
        """
        self.home_page.navigate()

        # Verify page loaded
        expect(self.page).to_have_title("CDP平台")

        # Verify heading
        expect(self.page.get_by_role("heading", name="欢迎来到CDP平台")).to_be_visible()

        # Verify core features are displayed
        expect(self.page.get_by_text("客户管理")).to_be_visible()
        expect(self.page.get_by_text("数据整合")).to_be_visible()
        expect(self.page.get_by_text("安全可靠")).to_be_visible()

    def test_cdp_home_002_home_navigate_to_login(self):
        """
        CDP-HOME-002: 首页导航到登录页

        前置条件：未登录
        测试步骤：在首页点击"登录"链接
        预期结果：页面跳转到登录页 http://localhost:3001/login
        """
        self.home_page.navigate()
        self.home_page.login_link.click()

        expect(self.page).to_have_url(re.compile(r"/login"))

    def test_cdp_home_003_home_navigate_to_register(self):
        """
        CDP-HOME-003: 首页导航到注册页

        前置条件：未登录
        测试步骤：在首页点击"注册"链接
        预期结果：页面跳转到注册页 http://localhost:3001/register
        """
        self.home_page.navigate()
        self.home_page.register_link.click()

        expect(self.page).to_have_url(re.compile(r"/register"))

    def test_cdp_home_004_logged_in_user_shows_user_info(self):
        """
        CDP-HOME-004: 已登录用户显示用户信息

        前置条件：用户已登录
        测试步骤：打开浏览器访问 http://localhost:3001
        预期结果：
            - 侧边栏显示用户名或用户头像
            - 显示"登出"或"退出"按钮
        """
        # First login
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(2000)

        # Navigate to home page
        self.home_page.navigate()

        # Should show sidebar user dropdown (data-testid in sidebar footer)
        expect(self.home_page.user_dropdown).to_be_visible()
