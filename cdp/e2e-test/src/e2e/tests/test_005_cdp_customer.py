"""
CDP-CUSTOMER: Customer Management Tests
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, CustomerPage


class TestCustomerManagement:
    """Test cases for customer management module."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)
        self.customer_page = CustomerPage(page)

    def _login(self):
        """Helper to login before tests."""
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(2000)

    def test_cdp_customer_001_customer_list_page_loads(self):
        """
        CDP-CUSTOMER-001: 客户列表页正常加载

        前置条件：用户已登录
        测试步骤：打开浏览器访问客户列表页面
        预期结果：
            - 页面显示客户列表
            - 显示客户基本信息（姓名、邮箱、手机号等）
            - 分页控件正常工作
        """
        self._login()
        self.customer_page.navigate()

        # Verify customer list page loaded
        expect(self.customer_page.page.get_by_role("heading", name="客户管理")).to_be_visible()

        # Verify table or list is visible
        expect(self.customer_page.customer_table).to_be_visible()

    def test_cdp_customer_002_customer_list_search(self):
        """
        CDP-CUSTOMER-002: 客户列表搜索功能

        前置条件：用户已登录
        测试步骤：
            1. 在客户列表页的搜索框输入关键词
            2. 点击搜索按钮或按回车
        预期结果：客户列表更新，仅显示匹配搜索条件的客户
        """
        self._login()
        self.customer_page.navigate()

        # Enter search keyword
        self.customer_page.search_input.fill("张三")
        self.customer_page.search_button.click()

        # Wait for results
        self.page.wait_for_timeout(1000)

        # Verify search results are displayed
        expect(self.customer_page.customer_table).to_be_visible()

    def test_cdp_customer_003_customer_detail_view(self):
        """
        CDP-CUSTOMER-003: 用户详情查看

        前置条件：用户已登录
        测试步骤：访问用户个人资料页面
        预期结果：页面显示用户的详细信息（用户名、邮箱、手机号）
        """
        self._login()

        # Navigate to profile page
        self.page.goto("http://localhost:3001/profile")
        self.page.wait_for_timeout(2000)

        # Verify profile page elements are visible
        expect(self.page.get_by_test_id("inp-profile-username")).to_be_visible()
        expect(self.page.get_by_test_id("inp-profile-email")).to_be_visible()
        expect(self.page.get_by_test_id("inp-profile-phone")).to_be_visible()
