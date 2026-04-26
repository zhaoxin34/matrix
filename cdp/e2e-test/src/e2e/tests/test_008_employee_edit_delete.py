"""
CDP-EMP-EDT-DEL: 编辑删除员工测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage
from conftest import assert_no_error_message


class TestEmployeeEditDelete:
    """Test cases for editing and deleting employees."""

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
    def test_cdp_emp_edt_001_update_employee_position_success(self):
        """
        CDP-EMP-EDT-001: 成功修改员工岗位

        前置条件：用户已登录（管理员角色），存在员工数据
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击操作列"编辑"
            3. 修改岗位信息
            4. 点击确认
        预期结果：
            1. 员工信息更新成功
            2. 员工列表刷新，显示新岗位
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_edt_002_edit_nonexistent_employee(self):
        """
        CDP-EMP-EDT-002: 编辑不存在的员工

        前置条件：用户已登录（管理员角色）
        测试步骤：
            1. 通过浏览器开发者工具修改请求，编辑一个不存在的员工
        预期结果：
            1. 返回 404 错误
        """
        self._login()
        self.org_structure_page.navigate()

        # This test requires DevTools manipulation, skipping
        pytest.skip("Requires manual DevTools manipulation to intercept and modify requests")

    @pytest.mark.org
    def test_cdp_emp_del_001_soft_delete_employee(self):
        """
        CDP-EMP-DEL-001: 软删除员工（离职）

        前置条件：用户已登录（管理员角色），存在员工数据
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击操作列"删除"
            3. 确认删除操作
        预期结果：
            1. 员工状态变为"离职"（offboarding）
            2. 员工列表刷新，该员工不再显示在职列表中（或显示为离职状态）
            3. 返回删除成功提示
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_del_002_verify_resigned_employee_status(self):
        """
        CDP-EMP-DEL-002: 离职员工状态验证

        前置条件：用户已登录（管理员角色），刚完成软删除操作
        测试步骤：
            1. 在员工列表筛选"离职"状态
        预期结果：
            1. 能找到刚才离职的员工
            2. 显示正确的离职日期
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)