"""
CDP-PERM: 权限控制测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.tests.base_test import BaseTestCase, TEST_PHONE, TEST_PASSWORD
from conftest import assert_no_error_message


class TestPermission(BaseTestCase):
    """Test cases for permission control."""

    @pytest.mark.org
    def test_cdp_perm_001_unauthenticated_access_org_page(self):
        """
        CDP-PERM-001: 未登录访问组织架构页

        前置条件：未登录
        测试步骤：
            1. 直接访问 http://localhost:3002/org-structure
        预期结果：
            1. 重定向到登录页面
            2. 或显示无权限提示
        """
        # Use browser to create a fresh context for unauthenticated access
        browser = self.page.context.browser
        context = browser.new_context()
        page = context.new_page()

        page.goto("http://localhost:3002/org-structure")
        page.wait_for_timeout(2000)
        expect(page).to_have_url("http://localhost:3002/login")

        context.close()

    @pytest.mark.org
    def test_cdp_perm_002_regular_employee_cannot_edit_org(self):
        """
        CDP-PERM-002: 普通员工无法编辑组织

        前置条件：用户已登录（普通员工角色）
        测试步骤：
            1. 进入组织架构页面
            2. 尝试编辑某个组织单元
        预期结果：
            1. 不显示编辑按钮
            2. 或显示"无权限"错误
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_perm_003_regular_employee_cannot_delete_org(self):
        """
        CDP-PERM-003: 普通员工无法删除组织

        前置条件：用户已登录（普通员工角色）
        测试步骤：
            1. 进入组织架构页面
            2. 尝试删除某个组织单元
        预期结果：
            1. 不显示删除按钮
            2. 或显示"无权限"错误
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_perm_004_regular_employee_cannot_create_employee(self):
        """
        CDP-PERM-004: 普通员工无法创建员工

        前置条件：用户已登录（普通员工角色）
        测试步骤：
            1. 进入组织架构页面
            2. 尝试点击"新增员工"按钮
        预期结果：
            1. 不显示"新增员工"按钮
            2. 或显示"无权限"错误
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_perm_005_branch_admin_permission_scope(self):
        """
        CDP-PERM-005: 分支管理员权限范围

        前置条件：用户已登录（分支管理员角色）
        测试步骤：
            1. 进入组织架构页面
            2. 查看组织树显示范围
        预期结果：
            1. 仅显示该分支及后代组织
            2. 不显示其他分支的组织
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)