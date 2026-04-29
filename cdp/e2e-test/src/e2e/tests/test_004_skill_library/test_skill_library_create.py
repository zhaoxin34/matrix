"""
TC-SKILL: Skill Library Create Tests
技能库创建相关测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, SkillLibraryPage
from conftest import assert_no_error_message


class TestSkillLibraryCreate:
    """技能创建测试"""

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

    @pytest.mark.smoke
    def test_tc_skill_004_create_skill_basic_info(self):
        """
        TC-SKILL-004: 创建新技能 - 基本信息
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        self.skill_library_page.add_skill_button.click()

        dialog = self.page.get_by_role("dialog", name="新增技能")
        expect(dialog).to_be_visible()
        expect(self.page.get_by_text("基本信息")).to_be_visible()

        self.page.get_by_role("textbox", name="技能名称").fill("测试技能")
        self.page.get_by_role("textbox", name="作者").fill("测试作者")

        self.page.get_by_test_id("btn-create-next").click()

        expect(self.page.get_by_text("内容", exact=True)).to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_005_create_skill_content_edit(self):
        """
        TC-SKILL-005: 创建新技能 - 内容编辑
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        self.skill_library_page.add_skill_button.click()

        self.page.get_by_role("textbox", name="技能名称").fill("Markdown测试技能")
        self.page.get_by_role("textbox", name="作者").fill("测试作者")

        self.page.get_by_test_id("btn-create-next").click()

        # Wait for MD editor to load (dynamic import)
        editor = self.page.get_by_test_id("md-editor-content")
        expect(editor).to_be_visible()
        self.page.wait_for_timeout(1000)

        editor.locator("textarea").first.fill(
            "# Markdown标题\n\n这是测试内容\n\n- 列表项1\n- 列表项2"
        )

        self.page.get_by_test_id("btn-create-save").click()

        dialog = self.page.get_by_role("dialog", name="新增技能")
        expect(dialog).not_to_be_visible()

        expect(self.page.get_by_text("Markdown测试技能").first).to_be_visible()

        draft_rows = self.page.locator("table tbody tr").filter(
            has=self.page.locator("td:nth-child(2)").filter(has_text="Markdown测试技能")
        )
        expect(draft_rows.first.locator("td:nth-child(6)").get_by_text("草稿")).to_be_visible()

        assert_no_error_message(self.page)
