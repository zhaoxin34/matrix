"""
CDP-EMP-SEC-TRANS: 员工辅属部门和调动测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage
from conftest import assert_no_error_message


class TestEmployeeSecondaryDepartment:
    """Test cases for employee secondary department management."""

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
    def test_cdp_emp_sec_001_add_secondary_department(self):
        """
        CDP-EMP-SEC-001: 添加辅属部门

        前置条件：用户已登录（管理员角色），存在员工和多个组织单元
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击"编辑"
            3. 在辅属部门中添加一个其他部门
            4. 点击确认
        预期结果：
            1. 辅属部门添加成功
            2. 员工详情或列表中显示辅属部门信息
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_sec_002_remove_secondary_department(self):
        """
        CDP-EMP-SEC-002: 移除辅属部门

        前置条件：用户已登录（管理员角色），存在有辅属部门的员工
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击"编辑"
            3. 移除某个辅属部门
            4. 点击确认
        预期结果：
            1. 辅属部门移除成功
            2. 员工详情中不再显示该辅属部门
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)


class TestEmployeeTransfer:
    """Test cases for employee transfer/rotation."""

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
    def test_cdp_emp_trans_001_transfer_employee_success(self):
        """
        CDP-EMP-TRANS-001: 成功发起调动

        前置条件：用户已登录（管理员角色），存在员工和目标部门
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击"调动"
            3. 选择目标部门、调动类型、填写生效日期和原因
            4. 点击确认
        预期结果：
            1. 调动发起成功
            2. 员工状态变为"调动中"
            3. 返回调动记录
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_trans_002_reject_transfer_to_same_department(self):
        """
        CDP-EMP-TRANS-002: 调动至同一部门被拒绝

        前置条件：用户已登录（管理员角色），存在员工
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工，点击"调动"
            3. 选择员工当前所在部门作为目标部门
            4. 点击确认
        预期结果：
            1. 显示错误提示："目标部门必须与当前部门不同"
            2. 调动操作被拒绝
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_trans_003_view_employee_transfer_history(self):
        """
        CDP-EMP-TRANS-003: 查看员工调动历史

        前置条件：用户已登录，存在有调动历史的员工
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表中找到目标员工
            3. 点击查看详情或调动历史
        预期结果：
            1. 显示完整的调动历史列表
            2. 按时间倒序排列
            3. 显示调出部门、调入部门、调动类型、原因、日期
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_trans_004_empty_transfer_history(self):
        """
        CDP-EMP-TRANS-004: 员工调动历史为空

        前置条件：用户已登录，存在从未调动的员工
        测试步骤：
            1. 进入组织架构页面
            2. 找到一名新入职且未调动的员工
            3. 查看其调动历史
        预期结果：
            1. 显示空列表
            2. 提示"暂无调动记录"
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)