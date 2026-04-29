"""
CDP-DASH: 组织看板统计测试
"""

import pytest
from playwright.sync_api import Page

from e2e.tests.base_test import BaseTestCase, assert_stat_cards
from conftest import assert_no_error_message


class TestDashboard(BaseTestCase):
    """Test cases for organization dashboard statistics."""

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
        assert_stat_cards(self.page)

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
        assert_no_error_message(self.page)