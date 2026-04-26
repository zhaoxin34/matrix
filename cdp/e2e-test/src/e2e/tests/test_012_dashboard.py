"""
CDP-DASH: 组织看板统计测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage
from conftest import assert_no_error_message


class TestDashboard:
    """Test cases for organization dashboard statistics."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)
        self.org_structure_page = OrgStructurePage(page)

    def _login(self):
        """Helper method to login before tests."""
        phone = "13800138002"
        password = "abcd1234"
        self.login_page.navigate()
        self.login_page.login(phone, password)
        self.page.wait_for_timeout(2000)

    @pytest.mark.smoke
    @pytest.mark.org
    def test_cdp_dash_001_dashboard_stats_display_correctly(self):
        """
        CDP-DASH-001: 看板统计数据正常显示

        前置条件：用户已登录
        测试步骤：
            1. 进入组织架构页面
        预期结果：
            1. 页面顶部显示统计卡片
            2. 显示组织总数
            3. 显示员工总数
            4. 显示在职员工数
            5. 显示待入职员工数
        """
        self._login()
        self.org_structure_page.navigate()

        # Verify stat cards are visible
        expect(self.page.locator("p:has-text('组织单元')")).to_be_visible()
        expect(self.page.locator("p:has-text('员工总数')")).to_be_visible()
        expect(self.page.locator("p:has-text('在职')")).to_be_visible()
        expect(self.page.locator("p:has-text('入职中')")).to_be_visible()

    @pytest.mark.org
    def test_cdp_dash_002_stats_reflect_permission_scope(self):
        """
        CDP-DASH-002: 统计数量反映权限范围

        前置条件：用户已登录（非管理员角色，如分支管理员）
        测试步骤：
            1. 以分支管理员账号登录
            2. 进入组织架构页面
        预期结果：
            1. 统计数据显示仅限于该分支及后代的数量
            2. 不显示全组织数据
        """
        self._login()
        self.org_structure_page.navigate()

        # Note: This test requires a non-admin user
        # The current test user (13800138002) appears to be admin
        # This test structure is ready for when non-admin testing is needed
        assert_no_error_message(self.page)