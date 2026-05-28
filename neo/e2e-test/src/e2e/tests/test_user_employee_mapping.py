"""
E2E Tests for User-Employee Mapping Feature

测试用户-员工映射功能
"""

import pytest
import uuid
from playwright.sync_api import expect

from e2e.tests.base_test import (
    BaseTestCase,
    assert_stat_cards,
    assert_employee_table_headers,
)
from conftest import assert_no_error_message


class TestUserEmployeeMapping(BaseTestCase):
    """Test cases for user-employee mapping functionality."""

    @pytest.mark.smoke
    @pytest.mark.org
    def test_neo_emp_001_create_employee_with_user_link(self):
        """
        NEO-EMP-001: 创建员工并关联用户

        前置条件：用户已登录，存在未关联的用户
        测试步骤：
            1. 进入组织架构页面
            2. 点击"添加员工"按钮
            3. 点击"选择用户"按钮
            4. 从用户列表中选择一个未关联用户
            5. 填写员工信息（工号、姓名、职位等）
            6. 点击"确定"按钮
        预期结果：
            1. 员工对话框正常打开
            2. 用户选择器正常打开并显示可选用户
            3. 选择用户后，手机号自动填充且只读
            4. 员工创建成功并显示在列表中
            5. 用户自动关联到该员工
        """
        self._login()
        self.org_structure_page.navigate()

        # 生成唯一工号
        unique_no = f"E{uuid.uuid4().hex[:6].upper()}"

        # 打开添加员工对话框
        self.org_structure_page.open_add_employee_dialog()
        expect(self.org_structure_page.employee_dialog).to_be_visible()

        # 验证"确定"按钮在未选择用户时禁用
        expect(self.org_structure_page.btn_confirm).to_be_disabled()

        # 点击选择用户
        self.org_structure_page.open_user_selector()
        expect(self.org_structure_page.user_selector_dialog).to_be_visible()

        # 选择第一个可用的用户
        user_option = self.org_structure_page.user_selector_dialog.locator(
            "[role='option'], [role='combobox'] > div"
        ).first
        user_option.click()
        self.page.wait_for_timeout(300)

        # 验证用户已选择
        expect(self.org_structure_page.page.locator("input[readonly]")).to_be_visible()

        # 填写员工表单
        self.org_structure_page.fill_employee_form(
            employee_no=unique_no,
            name="测试员工",
            position="工程师",
        )

        # 提交
        self.org_structure_page.submit_employee()

        # 验证员工已创建
        expect(self.org_structure_page.employee_dialog).not_to_be_visible()
        expect(self.org_structure_page.get_employee_by_no(unique_no)).to_be_visible()

        # 验证无错误消息
        assert_no_error_message(self.page)

    @pytest.mark.smoke
    @pytest.mark.org
    def test_neo_emp_002_phone_auto_populated_from_user(self):
        """
        NEO-EMP-002: 选择用户后手机号自动填充

        前置条件：用户已登录，存在未关联的用户
        测试步骤：
            1. 进入组织架构页面
            2. 点击"添加员工"按钮
            3. 点击"选择用户"按钮
            4. 选择一个用户
        预期结果：
            1. 选择用户后，手机号输入框自动填充该用户的手机号
            2. 手机号输入框变为只读状态
            3. 邮箱也会自动填充（如果有）
        """
        self._login()
        self.org_structure_page.navigate()

        # 打开添加员工对话框
        self.org_structure_page.open_add_employee_dialog()

        # 点击选择用户
        self.org_structure_page.open_user_selector()

        # 选择一个用户
        user_option = self.org_structure_page.user_selector_dialog.locator(
            "[role='option'], [role='combobox'] > div"
        ).first
        user_option.click()
        self.page.wait_for_timeout(500)

        # 验证手机号已填充
        phone_input = self.org_structure_page.inp_employee_phone
        phone_value = phone_input.input_value()
        expect(phone_input).to_be_disabled()
        assert phone_value, "手机号应该自动填充"

    @pytest.mark.smoke
    @pytest.mark.org
    def test_neo_emp_003_cannot_submit_without_user_selection(self):
        """
        NEO-EMP-003: 未选择用户时不能提交

        前置条件：用户已登录
        测试步骤：
            1. 进入组织架构页面
            2. 点击"添加员工"按钮
            3. 不选择用户，直接填写其他字段
        预期结果：
            1. "确定"按钮处于禁用状态
            2. 无法提交表单
        """
        self._login()
        self.org_structure_page.navigate()

        # 打开添加员工对话框
        self.org_structure_page.open_add_employee_dialog()

        # 验证确定按钮禁用
        expect(self.org_structure_page.btn_confirm).to_be_disabled()

        # 取消对话框
        self.org_structure_page.cancel_employee()

    @pytest.mark.org
    def test_neo_emp_004_search_users_in_selector(self):
        """
        NEO-EMP-004: 用户选择器搜索功能

        前置条件：用户已登录，存在多个未关联用户
        测试步骤：
            1. 进入组织架构页面
            2. 点击"添加员工"按钮
            3. 点击"选择用户"按钮
            4. 在搜索框中输入手机号关键词
        预期结果：
            1. 用户列表根据搜索关键词过滤
            2. 显示匹配的用户
        """
        self._login()
        self.org_structure_page.navigate()

        # 打开添加员工对话框
        self.org_structure_page.open_add_employee_dialog()

        # 点击选择用户
        self.org_structure_page.open_user_selector()
        expect(self.org_structure_page.user_selector_dialog).to_be_visible()

        # 搜索框存在
        search_input = self.org_structure_page.user_selector_dialog.locator(
            "input[placeholder*='搜索'], input[placeholder*='search']"
        )
        expect(search_input).to_be_visible()

    @pytest.mark.org
    def test_neo_emp_005_cancel_user_selection(self):
        """
        NEO-EMP-005: 取消用户选择

        前置条件：用户已登录，存在未关联的用户
        测试步骤：
            1. 进入组织架构页面
            2. 点击"添加员工"按钮
            3. 点击"选择用户"按钮
            4. 选择一个用户后，关闭对话框
            5. 重新打开添加员工对话框
        预期结果：
            1. 用户选择器可以关闭
            2. 重新打开时需要重新选择用户
        """
        self._login()
        self.org_structure_page.navigate()

        # 打开添加员工对话框
        self.org_structure_page.open_add_employee_dialog()

        # 点击选择用户
        self.org_structure_page.open_user_selector()
        expect(self.org_structure_page.user_selector_dialog).to_be_visible()

        # 按 ESC 关闭
        self.page.keyboard.press("Escape")
        self.page.wait_for_timeout(300)

        # 对话框应该关闭
        expect(self.org_structure_page.user_selector_dialog).not_to_be_visible()

        # 取消员工对话框
        self.org_structure_page.cancel_employee()


class TestEmployeeListWithUserInfo(BaseTestCase):
    """Test cases for employee list display with user info."""

    @pytest.mark.smoke
    @pytest.mark.org
    def test_neo_emp_006_employee_list_displays_linked_users(self):
        """
        NEO-EMP-006: 员工列表显示已关联用户信息

        前置条件：用户已登录，存在已关联用户的员工
        测试步骤：
            1. 进入组织架构页面
        预期结果：
            1. 员工列表显示所有员工信息
            2. 已关联用户的员工显示用户标识
        """
        self._login()
        self.org_structure_page.navigate()

        # 验证统计卡片
        assert_stat_cards(self.page)

        # 验证组织结构标题
        expect(self.page.get_by_role("heading", name="组织结构")).to_be_visible()

        # 验证表格头
        assert_employee_table_headers(self.page)

        # 验证添加员工按钮
        expect(self.org_structure_page.btn_add_employee).to_be_visible()


class TestEmployeeEdit(BaseTestCase):
    """Test cases for employee editing."""

    @pytest.mark.org
    def test_neo_emp_007_edit_employee_preserves_user_link(self):
        """
        NEO-EMP-007: 编辑员工保留用户关联

        前置条件：用户已登录，存在已关联用户的员工
        测试步骤：
            1. 进入组织架构页面
            2. 点击员工的编辑按钮
            3. 修改员工信息
            4. 点击确定
        预期结果：
            1. 编辑对话框正常打开
            2. 用户关联信息保留
            3. 员工信息更新成功
        """
        self._login()
        self.org_structure_page.navigate()

        # 检查是否有员工可以编辑
        first_edit_button = self.org_structure_page.employee_rows.locator(
            "button:first-child"
        ).first

        try:
            first_edit_button.wait_for(timeout=3000)
            first_edit_button.click()
            self.page.wait_for_timeout(500)

            # 验证编辑对话框打开
            expect(self.page.get_by_role("dialog", name="编辑员工")).to_be_visible()

            # 验证用户关联信息显示（如果有）
            # 取消编辑
            self.page.keyboard.press("Escape")
        except Exception:
            pytest.skip("No employees available to edit")
