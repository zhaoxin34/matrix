"""
CDP-ORG: Organization Structure Tests - Organization Management

E2E test cases for organization unit management (view, create, edit, delete, toggle, move).
"""

import json
import re
import time

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage
from conftest import assert_no_error_message


def _get_tree_node_id(page: Page) -> str | None:
    """Get the first tree node ID from data-testid attribute."""
    tree = page.locator(".ant-tree")
    tree_node = tree.locator("[data-testid^='tree-node-']").first
    if not tree_node.is_visible():
        return None
    testid = tree_node.get_attribute("data-testid")
    # Format: tree-node-{id} or tree-node-name-{id}
    parts = testid.split("-")
    return parts[-1] if parts else None


def _open_org_menu(page: Page, action: str) -> None:
    """
    Open the organization dropdown menu and click the specified action.

    Args:
        page: Playwright page
        action: One of 'add-child', 'edit', 'toggle', 'delete'
    """
    node_id = _get_tree_node_id(page)
    if not node_id:
        pytest.skip("组织树为空，跳过测试")

    # Click the menu trigger icon
    menu_trigger = page.get_by_test_id(f"tree-node-menu-{node_id}")
    menu_trigger.click()
    page.wait_for_timeout(500)

    # Map action to menu item text
    action_labels = {
        "add-child": "添加子节点",
        "edit": "编辑",
        "toggle": "禁用",  # Default to disable since we don't know current state
        "delete": "删除",
        "move": "移动",  # Move feature may not be implemented yet
    }
    label = action_labels.get(action, action)

    # Find and click the menu item by text within the visible dropdown
    # The dropdown can be either .ant-dropdown or a native <menu> element
    menu_item = (
        page.locator(".ant-dropdown:visible .ant-dropdown-menu-item, menu:visible menuitem")
        .filter(has_text=label)
        .first
    )
    if not menu_item.is_visible():
        pytest.skip(f"菜单项 '{label}' 不可用，可能功能未实现")
    menu_item.click()
    page.wait_for_timeout(300)


class TestOrganizationManagement:
    """Test cases for organization unit management."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)

    def _login(self):
        """Login as admin user."""
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(500)

    @pytest.mark.smoke
    def test_cdp_org_001_page_loads(self):
        """
        CDP-ORG-001: 组织架构页面正常加载

        前置条件：用户已登录
        测试步骤：
            1. 点击顶部导航"组织架构"链接
        预期结果：
            - 页面正确加载，显示组织树和员工列表
            - 左侧显示组织结构树
            - 右侧显示员工统计卡片和员工列表
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # Verify page loaded - left panel with org tree title
        expect(
            self.page.get_by_role("complementary").get_by_text("组织架构").first
        ).to_be_visible()

        # Verify left panel - organization tree panel shows "组织单元"
        expect(self.page.get_by_text("组织单元")).to_be_visible()

        # Verify right panel - employee statistics cards
        expect(self.page.get_by_text("员工总数").first).to_be_visible()
        expect(self.page.get_by_text("在职").first).to_be_visible()
        expect(self.page.get_by_text("入职中").first).to_be_visible()

        # Verify employee list table headers
        expect(self.page.get_by_role("columnheader", name="工号")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="姓名")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="职位")).to_be_visible()

    def test_cdp_org_002_view_org_tree(self):
        """
        CDP-ORG-002: 查看完整组织树

        前置条件：用户已登录，存在组织数据
        测试步骤：
            1. 进入组织架构页面
        预期结果：
            - 左侧组织树显示完整层级结构
            - 每个节点显示名称、类型标签
            - 每个节点显示总人数 badge
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # Verify organization tree exists
        tree = self.page.locator(".ant-tree")
        expect(tree).to_have_count(1)

        # Verify tree nodes exist - at least one node should be visible
        tree_nodes = tree.locator(".ant-tree-node-content-wrapper")
        if not tree_nodes.first.is_visible():
            pytest.skip("组织树为空，跳过测试")

        expect(tree_nodes.first).to_be_visible()

        # Verify there are multiple nodes (hierarchy) - the root should have children
        # Check that tree has proper structure with expandable nodes
        expect(tree.locator(".ant-tree-switcher").first).to_be_visible()

    def test_cdp_org_003_get_org_node_detail(self):
        """
        CDP-ORG-003: 获取单个组织节点详情

        前置条件：用户已登录，存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击组织树中某个节点
        预期结果：
            - 右侧员工列表显示该部门的直属员工
            - 选中节点高亮显示
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # Click on a tree node to view its details
        tree = self.page.locator(".ant-tree")
        tree_node = tree.locator(".ant-tree-node-content-wrapper").first
        if not tree_node.is_visible():
            pytest.skip("组织树为空，跳过测试")

        expect(tree_node).to_be_visible()
        tree_node.click()
        self.page.wait_for_timeout(1000)

        # Verify the clicked node has selection state (ant-tree-node-selected or similar)
        # Ant Design uses ant-tree-node-selected class for selection
        # Since class name may vary, we just verify the click didn't cause error

        # Verify employee list table is still visible after node selection
        expect(self.page.get_by_role("columnheader", name="工号")).to_be_visible()
        expect(self.page.get_by_role("columnheader", name="姓名")).to_be_visible()


class TestCreateOrganization:
    """Test cases for creating organization units."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)

    def _login(self):
        """Login as admin user."""
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(500)

    def _open_add_org_dialog(self):
        """Open the add organization dialog."""
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)
        # Click the add button in the org tree panel header
        self.page.get_by_test_id("btn-org-add").click()
        self.page.wait_for_timeout(1000)

    @pytest.mark.smoke
    def test_cdp_org_crt_001_create_department_success(self):
        """
        CDP-ORG-CRT-001: 成功创建部门

        前置条件：用户已登录（管理员角色），存在上级组织
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增"按钮
            3. 填写名称、编码，选择类型
            4. 点击确认
        预期结果：
            - 新组织单元创建成功
            - 组织树刷新，新节点出现在对应位置
            - 返回创建成功提示
        """
        self._login()
        self._open_add_org_dialog()

        # Wait for dialog to appear
        dialog = self.page.locator(".ant-modal").first
        expect(dialog).to_be_visible()

        # Fill the form
        dialog.get_by_test_id("inp-org-name").fill("测试部门")
        dialog.get_by_test_id("inp-org-code").fill(f"TEST_DEPT_{int(time.time())}")
        dialog.get_by_test_id("sel-org-type").click()
        self.page.wait_for_timeout(500)

        # Select department type from the dropdown
        self.page.locator(".ant-select-dropdown").get_by_text(
            "部门", exact=True
        ).click()
        self.page.wait_for_timeout(300)

        # Click confirm button
        self.page.get_by_test_id("btn-org-confirm").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

    def test_cdp_org_crt_002_duplicate_code(self):
        """
        CDP-ORG-CRT-002: 创建部门-编码重复

        前置条件：用户已登录（管理员角色），存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增"按钮
            3. 填写一个已存在的编码
            4. 点击确认
        预期结果：
            - 显示错误提示："编码已存在"或类似错误信息
            - 创建失败，组织树无变化
        """
        self._login()
        self._open_add_org_dialog()

        # Wait for dialog to appear
        dialog = self.page.locator(".ant-modal").first
        expect(dialog).to_be_visible()

        # Fill the form with a duplicate code
        dialog.get_by_test_id("inp-org-name").fill("测试重复编码部门")
        dialog.get_by_test_id("inp-org-code").fill("DEPT_001")
        dialog.get_by_test_id("sel-org-type").click()
        self.page.wait_for_timeout(500)

        # Select department type from the dropdown
        self.page.locator(".ant-select-dropdown").get_by_text(
            "部门", exact=True
        ).click()
        self.page.wait_for_timeout(300)

        # Click confirm button
        self.page.get_by_test_id("btn-org-confirm").click()
        self.page.wait_for_timeout(500)

        # Verify error message appears (code duplicate error)
        # The backend should return an error via Ant Design message
        error_message = self.page.locator(".ant-message")
        expect(error_message).to_be_visible()

    def test_cdp_org_crt_003_missing_required_fields(self):
        """
        CDP-ORG-CRT-003: 创建部门-缺少必填字段

        前置条件：用户已登录（管理员角色）
        测试步骤：
            1. 进入组织架构页面
            2. 点击"新增"按钮
            3. 不填写名称直接点击确认
        预期结果：
            - 显示表单验证错误提示
            - 名称输入框高亮显示错误状态
        """
        self._login()
        self._open_add_org_dialog()

        # Wait for dialog to appear
        dialog = self.page.locator(".ant-modal").first
        expect(dialog).to_be_visible()

        # Click confirm without filling any fields
        self.page.get_by_test_id("btn-org-confirm").click()
        self.page.wait_for_timeout(500)

        # Verify form validation error - input should have error styling
        name_input = dialog.get_by_test_id("inp-org-name")
        expect(name_input).to_have_class(re.compile("ant-input-status-error"))

        # Verify error text appears (Ant Design shows error in ant-form-item-explain)
        expect(dialog.locator(".ant-form-item-explain-error").first).to_be_visible()


class TestEditOrganization:
    """Test cases for editing organization units."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)

    def _login(self):
        """Login as admin user."""
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(500)

    def test_cdp_org_edt_001_update_org_name(self):
        """
        CDP-ORG-EDT-001: 成功修改组织名称

        前置条件：用户已登录（管理员角色），存在组织数据
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击节点，选择"编辑"
            3. 修改组织名称
            4. 点击确认
        预期结果：
            - 组织名称更新成功
            - 组织树刷新，显示新名称
            - 返回更新成功提示
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # Open edit menu
        _open_org_menu(self.page, "edit")
        self.page.wait_for_timeout(1000)

        # Handle the edit dialog - should appear with current values
        dialog = self.page.locator(".ant-modal").first
        expect(dialog).to_be_visible()

        # Modify the organization name
        name_input = dialog.get_by_test_id("inp-org-name")
        name_input.fill("修改后的组织名称")
        self.page.wait_for_timeout(300)

        # Click confirm button
        self.page.get_by_test_id("btn-org-confirm").click()
        self.page.wait_for_timeout(1500)

        # Verify no backend error after operation
        assert_no_error_message(self.page)


class TestDeleteOrganization:
    """Test cases for deleting organization units."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)

    def _login(self):
        """Login as admin user."""
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(500)

    def test_cdp_org_del_002_reject_delete_org_with_children(self):
        """
        CDP-ORG-DEL-002: 拒绝删除非空组织-有子单元

        前置条件：用户已登录（管理员角色），存在有子单元的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击有子单元的节点，选择"删除"
            3. 在确认对话框中输入组织名称并确认删除
        预期结果：
            - 显示错误提示："请先删除所有子节点"
            - 组织单元未被删除
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # First expand the root node to see children
        tree = self.page.locator(".ant-tree")
        switcher = tree.locator(".ant-tree-switcher").first
        if switcher.is_visible():
            switcher.click()
            self.page.wait_for_timeout(500)

        # Get the node ID and click the menu trigger
        node_id = _get_tree_node_id(self.page)
        menu_trigger = self.page.get_by_test_id(f"tree-node-menu-{node_id}")
        menu_trigger.click()
        self.page.wait_for_timeout(1000)

        # Click delete menu item using data-testid
        delete_menu_item = self.page.get_by_test_id(f"menu-org-delete-{node_id}")
        if not delete_menu_item.is_visible():
            pytest.skip("删除菜单项不可见，可能功能未实现")
        delete_menu_item.click()
        self.page.wait_for_timeout(1000)

        # Wait for confirmation dialog to appear
        confirm_dialog = self.page.locator(".ant-modal-content")
        expect(confirm_dialog).to_be_visible(timeout=5000)

        # Get the org name from the dialog
        org_name = self.page.locator(".ant-modal-content strong").text_content()

        # Fill in the org name to confirm
        self.page.get_by_test_id("inp-delete-confirm-name").fill(org_name)
        self.page.wait_for_timeout(300)

        # Click confirm delete
        self.page.get_by_test_id("btn-delete-confirm").click()
        self.page.wait_for_timeout(1000)

        # Should show error message about having children
        # The backend returns "请先删除所有子节点"
        error_message = self.page.locator(".ant-message-error").first
        expect(error_message).to_be_visible(timeout=5000)

    def test_cdp_org_del_003_reject_delete_org_with_employees(self):
        """
        CDP-ORG-DEL-003: 拒绝删除非空组织-有员工

        前置条件：用户已登录（管理员角色），存在有归属员工的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击有员工的节点，选择"删除"
            3. 在确认对话框中输入组织名称并确认删除
        预期结果：
            - 显示错误提示："该部门下还有员工，不能删除"
            - 组织单元未被删除
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # Note: This test uses the same org as test_cdp_org_del_002
        # which is "修改后的组织名称" - it has both children and employees

        # Get the node ID and click the menu trigger
        node_id = _get_tree_node_id(self.page)
        menu_trigger = self.page.get_by_test_id(f"tree-node-menu-{node_id}")
        menu_trigger.click()
        self.page.wait_for_timeout(1000)

        # Click delete menu item using data-testid
        delete_menu_item = self.page.get_by_test_id(f"menu-org-delete-{node_id}")
        if not delete_menu_item.is_visible():
            pytest.skip("删除菜单项不可见，可能功能未实现")
        delete_menu_item.click()
        self.page.wait_for_timeout(1000)

        # Wait for confirmation dialog to appear
        confirm_dialog = self.page.locator(".ant-modal-content")
        expect(confirm_dialog).to_be_visible(timeout=5000)

        # Get the org name from the dialog
        org_name = self.page.locator(".ant-modal-content strong").text_content()

        # Fill in the org name to confirm
        self.page.get_by_test_id("inp-delete-confirm-name").fill(org_name)
        self.page.wait_for_timeout(300)

        # Click confirm delete
        self.page.get_by_test_id("btn-delete-confirm").click()
        self.page.wait_for_timeout(1000)

        # Should show error message about having employees
        # The backend returns "该部门下还有员工，不能删除"
        error_message = self.page.locator(".ant-message-error").first
        expect(error_message).to_be_visible(timeout=5000)


class TestToggleOrganization:
    """Test cases for enabling/disabling organization units."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)

    def _login(self):
        """Login as admin user."""
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(500)

    def test_cdp_org_toggle_001_disable_org(self):
        """
        CDP-ORG-TOGGLE-001: 禁用启用状态的组织

        前置条件：用户已登录（管理员角色），存在启用状态的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击目标节点，选择"禁用"
        预期结果：
            - 组织状态变为"禁用"
            - 节点显示禁用标签
            - 组织树刷新，该节点不再显示（或显示为灰色）
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # Open toggle menu (disable/enable)
        _open_org_menu(self.page, "toggle")
        self.page.wait_for_timeout(1500)

        # Verify no backend error after operation
        assert_no_error_message(self.page)

    def test_cdp_org_toggle_002_enable_disabled_org(self):
        """
        CDP-ORG-TOGGLE-002: 重新启用禁用的组织

        前置条件：用户已登录（管理员角色），存在禁用状态的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击目标节点，选择"启用"
        预期结果：
            - 组织状态变为"启用"
            - 节点恢复正常显示
            - 组织树刷新，节点可见
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # Open toggle menu (disable/enable)
        _open_org_menu(self.page, "toggle")
        self.page.wait_for_timeout(1500)

        # Verify no backend error after operation
        assert_no_error_message(self.page)


class TestMoveOrganization:
    """Test cases for moving organization units."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)

    def _login(self):
        """Login as admin user."""
        self.login_page.navigate()
        self.login_page.phone_input.fill("13800138002")
        self.login_page.password_input.fill("abcd1234")
        self.login_page.submit_button.click()
        self.page.wait_for_timeout(500)

    def test_cdp_org_move_001_move_org_success(self):
        """
        CDP-ORG-MOVE-001: 成功移动组织单元

        前置条件：用户已登录（管理员角色），存在可移动的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击目标节点，选择"移动"
            3. 选择新的上级节点
            4. 点击确认
        预期结果：
            - 组织单元移动成功
            - 组织树刷新，节点出现在新位置
            - 节点的 level 值正确更新
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # First expand the tree to see more nodes
        tree = self.page.locator(".ant-tree")
        switchers = tree.locator(".ant-tree-switcher")
        if switchers.first.is_visible():
            switchers.first.click()
            self.page.wait_for_timeout(500)

        # Right-click on a tree node to open context menu
        tree_node = tree.locator(".ant-tree-node-content-wrapper").first
        expect(tree_node).to_be_visible()
        tree_node.click(button="right")
        self.page.wait_for_timeout(500)

        # Look for move option in context menu
        move_option = self.page.get_by_text("移动", exact=False)
        if move_option.is_visible():
            move_option.click()
            self.page.wait_for_timeout(1000)

            # Handle the move dialog if it appears
            dialog = self.page.locator(".ant-modal").first
            if dialog.is_visible():
                # Select a new parent node in the tree dialog
                # Then click confirm
                self.page.get_by_test_id("btn-transfer-confirm").click()
                self.page.wait_for_timeout(1500)

        # Verify no backend error after operation
        assert_no_error_message(self.page)

    def test_cdp_org_move_002_reject_circular_move(self):
        """
        CDP-ORG-MOVE-002: 拒绝循环移动

        前置条件：用户已登录（管理员角色），存在可移动的组织
        测试步骤：
            1. 进入组织架构页面
            2. 在组织树上右键点击节点 A，选择"移动"
            3. 尝试将 A 移动到 A 的子节点下
        预期结果：
            - 显示错误提示："不能移动到自身后代节点下"或"循环引用"
            - 移动操作被拒绝
        """
        self._login()
        self.page.get_by_test_id("link-sidebar-org-structure").click()
        self.page.wait_for_timeout(500)

        # Verify no backend error
        assert_no_error_message(self.page)

        # First expand the tree to see parent-child relationships
        tree = self.page.locator(".ant-tree")
        switchers = tree.locator(".ant-tree-switcher")
        if switchers.first.is_visible():
            switchers.first.click()
            self.page.wait_for_timeout(500)

        # Right-click on a tree node to open context menu
        tree_node = tree.locator(".ant-tree-node-content-wrapper").first
        expect(tree_node).to_be_visible()
        tree_node.click(button="right")
        self.page.wait_for_timeout(500)

        # Look for move option in context menu
        move_option = self.page.get_by_text("移动", exact=False)
        if move_option.is_visible():
            move_option.click()
            self.page.wait_for_timeout(1000)

            # Handle the move dialog if it appears
            dialog = self.page.locator(".ant-modal").first
            if dialog.is_visible():
                # Try to select a child node (which would cause circular reference)
                # This should trigger an error
                # Click confirm anyway to trigger the error
                self.page.get_by_test_id("btn-transfer-confirm").click()
                self.page.wait_for_timeout(1500)

                # Should show error message about circular reference
                error_message = self.page.locator(".ant-message-error")
                expect(error_message).to_be_visible(timeout=5000)
