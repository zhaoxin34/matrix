"""
CDP-ORG: 组织单元管理测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.tests.base_test import BaseTestCase, assert_stat_cards, assert_employee_table_headers
from conftest import assert_no_error_message


class TestOrgManagement(BaseTestCase):
    """Test cases for organization unit management module."""

    @pytest.mark.smoke
    @pytest.mark.org
    def test_cdp_org_001_page_loads_correctly(self):
        """
        CDP-ORG-001: 组织架构页面正常加载

        前置条件：用户已登录
        测试步骤：
            1. 点击顶部导航"组织架构"链接
        预期结果：
            1. 页面正确加载，显示组织树和员工列表
            2. 左侧显示组织结构树
            3. 右侧显示员工统计卡片和员工列表
        """
        self._login()
        self.org_structure_page.navigate()

        expect(self.page.get_by_role("heading", name="组织架构")).to_be_visible()
        assert_stat_cards(self.page)
        expect(self.page.get_by_role("heading", name="组织结构")).to_be_visible()
        expect(self.page.get_by_role("heading", name="员工列表")).to_be_visible()
        assert_employee_table_headers(self.page)
        expect(self.page.get_by_role("button", name="新增")).to_be_visible()
        expect(self.page.get_by_role("button", name="添加员工")).to_be_visible()

    @pytest.mark.smoke
    @pytest.mark.org
    def test_cdp_org_002_view_complete_org_tree(self):
        """
        CDP-ORG-002: 查看完整组织树

        前置条件：用户已登录，存在组织数据
        测试步骤：
            1. 进入组织架构页面
        预期结果：
            1. 左侧组织树显示完整层级结构
            2. 每个节点显示名称、类型标签
            3. 每个节点显示总人数 badge
        """
        self._login()
        self.org_structure_page.navigate()
        expect(self.page.get_by_role("heading", name="组织结构")).to_be_visible()

    @pytest.mark.smoke
    @pytest.mark.org
    def test_cdp_org_003_select_org_node_details(self):
        """
        CDP-ORG-003: 获取单个组织节点详情

        前置条件：用户已登录，存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击组织树中某个节点
        预期结果：
            1. 右侧员工列表显示该部门的直属员工
            2. 选中节点高亮显示
        """
        self._login()
        self.org_structure_page.navigate()
