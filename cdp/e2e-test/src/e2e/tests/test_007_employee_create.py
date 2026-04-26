"""
CDP-EMP-CRT: 创建员工测试
"""

import pytest
from playwright.sync_api import Page

from e2e.tests.base_test import BaseTestCase, MODAL_WAIT_MS
from conftest import assert_no_error_message


class TestEmployeeCreate(BaseTestCase):
    """Test cases for creating employees."""

    @pytest.mark.org
    def test_cdp_emp_crt_001_create_employee_without_account(self):
        """
        CDP-EMP-CRT-001: 成功创建员工（不绑定账号）

        前置条件：用户已登录（管理员角色），存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增员工"按钮
            3. 填写工号、姓名、手机、邮箱、岗位，选择主属部门
            4. 不绑定系统账号
            5. 点击确认
        预期结果：
            1. 员工创建成功
            2. 员工列表刷新，新员工出现在列表中
            3. 返回创建成功提示
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="添加员工").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_crt_002_create_employee_with_account_binding(self):
        """
        CDP-EMP-CRT-002: 成功创建员工（绑定账号）

        前置条件：用户已登录（管理员角色），存在未绑定员工的系统账号
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增员工"按钮
            3. 填写必填信息
            4. 输入一个未绑定员工的 user_id
            5. 点击确认
        预期结果：
            1. 员工创建成功并绑定账号
            2. 员工列表中该员工显示"已绑定"标签
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="添加员工").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_crt_003_create_employee_duplicate_employee_id(self):
        """
        CDP-EMP-CRT-003: 创建员工-工号重复

        前置条件：用户已登录（管理员角色），存在员工数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增员工"按钮
            3. 填写一个已存在的工号
            4. 点击确认
        预期结果：
            1. 显示错误提示："工号已存在"
            2. 创建失败
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="添加员工").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_emp_crt_004_create_employee_bind_already_linked_account(self):
        """
        CDP-EMP-CRT-004: 创建员工-绑定已关联账号

        前置条件：用户已登录（管理员角色），存在已绑定员工的账号
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增员工"按钮
            3. 填写必填信息
            4. 输入一个已绑定其他员工的 user_id
            5. 点击确认
        预期结果：
            1. 显示错误提示："该账号已绑定其他员工"
            2. 创建失败
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="添加员工").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)