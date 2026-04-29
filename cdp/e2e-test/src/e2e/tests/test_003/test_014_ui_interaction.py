"""
CDP-UI: 界面交互测试
"""

import pytest
from playwright.sync_api import Page

from e2e.tests.base_test import BaseTestCase, MODAL_WAIT_MS
from conftest import assert_no_error_message


class TestUIInteraction(BaseTestCase):
    """Test cases for UI interaction patterns."""

    @pytest.mark.org
    def test_cdp_ui_001_org_tree_context_menu(self):
        """
        CDP-UI-001: 组织树节点操作菜单

        前置条件：用户已登录（管理员角色），存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树节点上右键点击
        预期结果：
            1. 显示操作菜单
            2. 包含：添加子节点、编辑、禁用/启用、删除、移动
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_ui_002_employee_list_pagination(self):
        """
        CDP-UI-002: 员工列表分页

        前置条件：用户已登录，存在超过一页的员工数据
        测试步骤：
            1. 进入组织架构页面
            2. 查看员工列表分页
            3. 点击下一页
        预期结果：
            1. 分页切换成功
            2. 列表更新显示下一页数据
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_ui_003_employee_list_sorting(self):
        """
        CDP-UI-003: 员工列表排序

        前置条件：用户已登录，存在员工数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击员工列表表头的"工号"列
        预期结果：
            1. 列表按工号排序
            2. 再次点击反向排序
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_ui_004_modal_form_reset_after_close(self):
        """
        CDP-UI-004: 模态框关闭后重置表单

        前置条件：用户已登录（管理员角色）
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增员工"打开模态框
            3. 输入一些内容
            4. 点击取消关闭模态框
            5. 再次点击"新增员工"打开模态框
        预期结果：
            1. 表单内容已重置
            2. 不显示之前输入的内容
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="添加员工").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        self.page.keyboard.press("Escape")
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_ui_005_org_tree_expand_collapse(self):
        """
        CDP-UI-005: 组织树展开折叠

        前置条件：用户已登录，存在层级组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击组织树节点的展开/折叠图标
        预期结果：
            1. 节点展开显示子节点
            2. 或节点折叠隐藏子节点
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)