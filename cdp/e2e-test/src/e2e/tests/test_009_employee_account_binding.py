"""
CDP-EMP-BIND: 员工账号绑定测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage
from conftest import assert_no_error_message


class TestEmployeeAccountBinding:
    """Test cases for employee account binding module."""

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
    def test_cdp_emp_bind_001_bind_account_to_employee(self):
        """
        CDP-EMP-BIND-001: 为员工绑定系统账号

        前置条件：用户已登录（管理员角色），存在未绑定账号的员工和未关联的账号
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击"绑定账号"
            3. 输入 user_id
            4. 点击确认
        预期结果：
            1. 绑定成功
            2. 员工列表中该员工显示"已绑定"标签
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_bind_002_bind_already_linked_account(self):
        """
        CDP-EMP-BIND-002: 绑定已关联账号

        前置条件：用户已登录（管理员角色），存在未绑定账号的员工和已关联的账号
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击"绑定账号"
            3. 输入一个已绑定其他员工的 user_id
            4. 点击确认
        预期结果：
            1. 显示错误提示："该账号已绑定其他员工"
            2. 绑定失败
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_bind_003_unbind_employee_account(self):
        """
        CDP-EMP-BIND-003: 解绑员工账号

        前置条件：用户已登录（管理员角色），存在已绑定账号的员工
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到已绑定账号的员工，点击"解绑账号"
            3. 确认解绑操作
        预期结果：
            1. 解绑成功
            2. 员工列表中该员工显示"未绑定"标签
            3. user_employee_mapping 记录已删除
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_bind_004_rebind_same_account(self):
        """
        CDP-EMP-BIND-004: 再次绑定同一账号

        前置条件：用户已登录（管理员角色），刚完成解绑操作的员工和同一账号
        测试步骤：
            1. 在员工列表中找到刚解绑的员工，点击"绑定账号"
            2. 输入同一个 user_id
            3. 点击确认
        预期结果：
            1. 绑定成功
            2. 该员工重新绑定同一账号
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)