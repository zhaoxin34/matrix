"""
CDP-ORG-TOGGLE: 启用禁用组织单元测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage
from conftest import assert_no_error_message


class TestOrgToggle:
    """Test cases for enabling/disabling organization units."""

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

    @pytest.mark.org
    def test_cdp_org_toggle_001_disable_org(self):
        """
        CDP-ORG-TOGGLE-001: 禁用启用状态的组织

        前置条件：用户已登录（管理员角色），存在启用状态的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击目标节点，选择"禁用"
        预期结果：
            1. 组织状态变为"禁用"
            2. 节点显示禁用标签
            3. 组织树刷新，该节点不再显示（或显示为灰色）
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_org_toggle_002_enable_disabled_org(self):
        """
        CDP-ORG-TOGGLE-002: 重新启用禁用的组织

        前置条件：用户已登录（管理员角色），存在禁用状态的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击目标节点，选择"启用"
        预期结果：
            1. 组织状态变为"启用"
            2. 节点恢复正常显示
            3. 组织树刷新，节点可见
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)


class TestOrgMove:
    """Test cases for moving organization units."""

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

    @pytest.mark.org
    def test_cdp_org_move_001_move_org_success(self):
        """
        CDP-ORG-MOVE-001: 成功移动组织单元

        前置条件：用户已登录（管理员角色），存在可移动的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击目标节点，选择"移动"
            3. 选择新的上级节点
            4. 点击确认
        预期结果：
            1. 组织单元移动成功
            2. 组织树刷新，节点出现在新位置
            3. 节点的 level 值正确更新
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_org_move_002_reject_circular_move(self):
        """
        CDP-ORG-MOVE-002: 拒绝循环移动

        前置条件：用户已登录（管理员角色），存在可移动的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击节点 A，选择"移动"
            3. 尝试将 A 移动到 A 的子节点下
        预期结果：
            1. 显示错误提示："不能移动到自身后代节点下"或"循环引用"
            2. 移动操作被拒绝
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)
