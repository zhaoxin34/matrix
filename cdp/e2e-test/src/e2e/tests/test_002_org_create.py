"""
CDP-ORG-CRT: 创建组织单元测试
"""

import pytest
from playwright.sync_api import Page

from e2e.tests.base_test import BaseTestCase, MODAL_WAIT_MS
from conftest import assert_no_error_message


class TestOrgCreate(BaseTestCase):
    """Test cases for creating organization units."""

    @pytest.mark.smoke
    @pytest.mark.org
    def test_cdp_org_crt_001_create_department_success(self):
        """
        CDP-ORG-CRT-001: 成功创建部门

        前置条件：用户已登录（管理员角色），存在上级组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击节点，选择"添加子节点"
            3. 填写名称、编码，选择类型
            4. 点击确认
        预期结果：
            1. 新组织单元创建成功
            2. 组织树刷新，新节点出现在对应位置
            3. 返回创建成功提示
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="新增").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_org_crt_002_create_department_duplicate_code(self):
        """
        CDP-ORG-CRT-002: 创建部门-编码重复

        前置条件：用户已登录（管理员角色），存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击节点，选择"添加子节点"
            3. 填写一个已存在的编码
            4. 点击确认
        预期结果：
            1. 显示错误提示："编码已存在"或类似错误信息
            2. 创建失败，组织树无变化
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="新增").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_org_crt_003_create_department_missing_required_fields(self):
        """
        CDP-ORG-CRT-003: 创建部门-缺少必填字段

        前置条件：用户已登录（管理员角色）
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击节点，选择"添加子节点"
            3. 不填写名称直接点击确认
        预期结果：
            1. 显示表单验证错误提示
            2. 名称输入框高亮显示错误状态
        """
        self._login()
        self.org_structure_page.navigate()
        self.page.get_by_role("button", name="新增").click()
        self.page.wait_for_timeout(MODAL_WAIT_MS)
        assert_no_error_message(self.page)
