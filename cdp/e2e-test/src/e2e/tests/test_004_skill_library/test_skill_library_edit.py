"""
TC-SKILL: Skill Library Edit Tests
技能库编辑相关测试
"""

import pytest
import re
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, SkillLibraryPage
from conftest import assert_no_error_message


class TestSkillLibraryEdit:
    """技能编辑测试"""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.login_page = LoginPage(page)
        self.skill_library_page = SkillLibraryPage(page)

    def _login(self):
        """登录"""
        self.login_page.navigate()
        self.login_page.login("13800138002", "abcd1234")
        self.page.wait_for_url("**/home", timeout=10000)

    def _get_first_skill_code(self) -> str:
        """获取表格中第一个技能的代码"""
        # 获取第一行第一列的技能代码
        first_cell = self.page.locator("table tbody tr td:nth-child(1) p").first
        expect(first_cell).to_be_visible()
        return first_cell.text_content()

    @pytest.mark.smoke
    def test_tc_skill_008_edit_skill_basic_info(self):
        """
        TC-SKILL-008: 编辑技能基本信息
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 动态获取第一个技能的代码
        skill_code = self._get_first_skill_code()

        self.page.get_by_test_id(f"btn-edit-basic-{skill_code}").click()

        edit_dialog = self.page.get_by_role("dialog", name="编辑基本信息")
        expect(edit_dialog).to_be_visible()

        self.page.get_by_test_id("inp-edit-basic-name").locator("input").fill("测试技能-已修改")

        self.page.get_by_test_id("btn-edit-basic-confirm").click()

        expect(edit_dialog).not_to_be_visible()

        # 验证修改后的名称显示在列表中
        expect(self.page.get_by_text("测试技能-已修改").first).to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_009_edit_skill_content(self):
        """
        TC-SKILL-009: 编辑技能内容
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 动态获取第一个技能的代码
        skill_code = self._get_first_skill_code()

        self.page.get_by_test_id(f"btn-edit-content-{skill_code}").click()

        edit_dialog = self.page.get_by_role("dialog", name=re.compile("编辑内容"))
        expect(edit_dialog).to_be_visible()

        self.page.get_by_test_id("md-editor-edit-content").locator("textarea").first.fill(
            "# 更新后的标题\n\n更新后的内容\n\n- 新列表项1\n- 新列表项2"
        )

        self.page.get_by_test_id("btn-edit-content-confirm").click()

        expect(edit_dialog).not_to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_019_view_skill_detail(self):
        """
        TC-SKILL-019: 查看技能详情
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        view_buttons = self.page.locator("[data-testid^='btn-view-']")
        expect(view_buttons.first).to_be_visible()
        count = view_buttons.count()
        assert count > 0, "No view buttons found"

        view_buttons.first.click()

        expect(self.page.get_by_role("heading", name="技能详情")).to_be_visible()

        assert_no_error_message(self.page)
