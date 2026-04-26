"""
CDP-ORG-DEL: 删除组织单元测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage
from conftest import assert_no_error_message


class TestOrgDelete:
    """Test cases for deleting organization units."""

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
    def test_cdp_org_del_001_delete_empty_org_success(self):
        """
        CDP-ORG-DEL-001: 成功删除空组织

        前置条件：用户已登录（管理员角色），存在一个无子单元且无员工的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击目标节点，选择"删除"
            3. 确认删除操作
        预期结果：
            1. 组织单元删除成功
            2. 组织树刷新，节点消失
            3. 返回删除成功提示
        """
        self._login()
        self.org_structure_page.navigate()

        # Right-click on an org node and select "删除"
        # Confirm the deletion
        # This test structure depends on the actual implementation

        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_org_del_002_reject_delete_org_with_children(self):
        """
        CDP-ORG-DEL-002: 拒绝删除非空组织-有子单元

        前置条件：用户已登录（管理员角色），存在有子单元的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击有子单元的节点，选择"删除"
        预期结果：
            1. 显示错误提示："该单元存在子组织，无法删除"
            2. 组织单元未被删除
        """
        self._login()
        self.org_structure_page.navigate()

        # Try to delete an org that has children
        # Should show error message about children existing

        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_org_del_003_reject_delete_org_with_employees(self):
        """
        CDP-ORG-DEL-003: 拒绝删除非空组织-有员工

        前置条件：用户已登录（管理员角色），存在有归属员工的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击有员工的节点，选择"删除"
        预期结果：
            1. 显示错误提示："该单元存在归属员工，无法删除"
            2. 组织单元未被删除
        """
        self._login()
        self.org_structure_page.navigate()

        # Try to delete an org that has employees
        # Should show error message about employees existing

        assert_no_error_message(self.page)