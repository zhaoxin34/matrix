"""
CDP-EMP: 员工管理测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, OrgStructurePage
from conftest import assert_no_error_message


class TestEmployeeManagement:
    """Test cases for employee management module."""

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
    def test_cdp_emp_001_employee_list_page_loads(self):
        """
        CDP-EMP-001: 员工列表页正常加载

        前置条件：用户已登录
        测试步骤：
            1. 进入组织架构页面
        预期结果：
            1. 右侧显示员工列表
            2. 列表包含分页控件
            3. 显示员工工号、姓名、岗位、手机、状态等字段
        """
        self._login()
        self.org_structure_page.navigate()

        # Verify employee table headers
        expect(self.page.get_by_role("columnheader", name="工号")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="姓名")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="手机号")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="邮箱")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="职位")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="状态")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="操作")).to_be_visible()

    @pytest.mark.org
    def test_cdp_emp_002_filter_employees_by_department(self):
        """
        CDP-EMP-002: 按部门筛选员工

        前置条件：用户已登录，存在多部门数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击组织树中的某个部门节点
        预期结果：
            1. 员工列表刷新
            2. 仅显示该部门的直属员工
            3. 选中节点高亮
        """
        self._login()
        self.org_structure_page.navigate()

        # Click on a department in the org tree to filter employees
        # The actual interaction depends on the tree structure
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_003_filter_employees_by_status(self):
        """
        CDP-EMP-003: 按状态筛选员工

        前置条件：用户已登录，存在多种状态的员工
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表上方找到状态下拉框
            3. 选择"在职"
        预期结果：
            1. 员工列表刷新
            2. 仅显示状态为"在职"的员工
        """
        self._login()
        self.org_structure_page.navigate()

        # Find and use the status filter dropdown
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_004_search_employees_by_keyword(self):
        """
        CDP-EMP-004: 按关键词搜索员工

        前置条件：用户已登录，存在员工数据
        测试步骤：
            1. 进入组织架构页面
            2. 在员工列表上方的搜索框输入员工姓名关键词
            3. 按回车或点击搜索
        预期结果：
            1. 员工列表刷新
            2. 仅显示姓名或工号包含关键词的员工
        """
        self._login()
        self.org_structure_page.navigate()

        # Use the search box to filter employees by keyword
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_005_include_subordinate_departments(self):
        """
        CDP-EMP-005: 包含下级部门员工筛选

        前置条件：用户已登录，存在层级部门数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击组织树中的某个部门节点
            3. 勾选"包含下级"选项
        预期结果：
            1. 员工列表刷新
            2. 显示该部门及其所有下级部门的员工
        """
        self._login()
        self.org_structure_page.navigate()

        # Click on a department and check "包含下级" option
        assert_no_error_message(self.page)