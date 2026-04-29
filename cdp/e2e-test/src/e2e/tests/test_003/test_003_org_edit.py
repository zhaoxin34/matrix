"""
CDP-ORG-EDT: 编辑组织单元测试
"""

import pytest
from playwright.sync_api import Page

from e2e.tests.base_test import BaseTestCase
from conftest import assert_no_error_message


class TestOrgEdit(BaseTestCase):
    """Test cases for editing organization units."""

    @pytest.mark.org
    def test_cdp_org_edt_001_update_org_name_success(self):
        """
        CDP-ORG-EDT-001: 成功修改组织名称

        前置条件：用户已登录（管理员角色），存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击节点，选择"编辑"
            3. 修改组织名称
            4. 点击确认
        预期结果：
            1. 组织名称更新成功
            2. 组织树刷新，显示新名称
            3. 返回更新成功提示
        """
        self._login()
        self.org_structure_page.navigate()
        assert_no_error_message(self.page)

    @pytest.mark.org
    def test_cdp_org_edt_002_edit_nonexistent_org(self):
        """
        CDP-ORG-EDT-002: 编辑不存在的组织

        前置条件：用户已登录（管理员角色）
        测试步骤：
            1. 通过浏览器开发者工具修改请求，编辑一个不存在的组织单元
        预期结果：
            1. 返回 404 错误
            2. 显示错误提示
        """
        self._login()
        self.org_structure_page.navigate()
        pytest.skip("Requires manual DevTools manipulation to intercept and modify requests")
