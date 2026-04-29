"""
TC-SKILL: Skill Library Status Tests
技能库状态切换相关测试
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, SkillLibraryPage
from conftest import assert_no_error_message


class TestSkillLibraryStatus:
    """技能状态切换测试"""

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

    def _get_first_enabled_skill_code(self) -> str:
        """获取第一个启用状态的技能代码"""
        deactivate_buttons = self.page.locator("[data-testid^='btn-deactivate-']")
        expect(deactivate_buttons.first).to_be_visible()
        test_id = deactivate_buttons.first.get_attribute("data-testid")
        return test_id.replace("btn-deactivate-", "")

    def _get_first_disabled_skill_code(self) -> str:
        """获取第一个禁用状态的技能代码"""
        to_draft_buttons = self.page.locator("[data-testid^='btn-to-draft-']")
        expect(to_draft_buttons.first).to_be_visible()
        test_id = to_draft_buttons.first.get_attribute("data-testid")
        return test_id.replace("btn-to-draft-", "")

    @pytest.mark.smoke
    def test_tc_skill_013_disable_skill(self):
        """
        TC-SKILL-013: 禁用技能
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 动态获取启用状态的技能代码
        skill_code = self._get_first_enabled_skill_code()

        self.page.get_by_test_id(f"btn-deactivate-{skill_code}").click()

        # 等待并处理确认对话框
        confirm_dialog = self.page.get_by_role("dialog")
        expect(confirm_dialog).to_be_visible()
        self.page.get_by_role("button", name="确认").click()

        # 等待技能状态更新
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_timeout(500)

        # 验证技能状态变为"禁用"
        disabled_chips = self.page.locator(
            "table tbody tr td:nth-child(6)"
        ).get_by_text("禁用")
        expect(disabled_chips.first).to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_014_disable_to_draft(self):
        """
        TC-SKILL-014: 禁用技能转为草稿
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 检查是否有禁用状态的技能
        to_draft_buttons = self.page.locator("[data-testid^='btn-to-draft-']")
        if to_draft_buttons.count() == 0:
            pytest.skip("No disabled skills found in the database")

        # 动态获取禁用状态的技能代码
        skill_code = self._get_first_disabled_skill_code()

        self.page.get_by_test_id(f"btn-to-draft-{skill_code}").click()

        # 验证技能状态变为"草稿"
        draft_chips = self.page.locator("table tbody tr td:nth-child(6)").get_by_text(
            "草稿"
        )
        expect(draft_chips.first).to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_015_delete_disabled_skill(self):
        """
        TC-SKILL-015: 删除禁用技能
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 检查是否有禁用状态的技能
        delete_buttons = self.page.locator("[data-testid^='btn-delete-']")
        if delete_buttons.count() == 0:
            pytest.skip("No disabled skills found in the database")

        # 动态获取禁用状态的技能代码
        skill_code = self._get_first_disabled_skill_code()
        delete_button = self.page.get_by_test_id(f"btn-delete-{skill_code}")

        delete_button.click()

        # 等待并处理确认对话框 (删除技能会弹出确认框)
        confirm_dialog = self.page.get_by_role("dialog")
        expect(confirm_dialog).to_be_visible()
        self.page.wait_for_timeout(500)
        self.page.get_by_role("button", name="确认").click()

        # 等待删除操作完成 - 等待网络请求完成并且UI更新
        self.page.wait_for_load_state("networkidle")
        self.page.wait_for_timeout(2000)  # 额外等待确保 UI 更新

        # 验证技能已从列表中移除
        skill_rows = self.page.locator("table tbody tr")
        expect(skill_rows.first).to_be_visible()
        row_count = skill_rows.count()
        found = False
        for i in range(row_count):
            row_text = skill_rows.nth(i).text_content()
            if skill_code in row_text:
                found = True
                break
        assert not found, f"Deleted skill {skill_code} still appears in the list"

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_018_disabled_shows_multiple_buttons(self):
        """
        TC-SKILL-018: 禁用状态显示多个按钮
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 检查是否有禁用状态的技能
        to_draft_buttons = self.page.locator("[data-testid^='btn-to-draft-']")
        if to_draft_buttons.count() == 0:
            pytest.skip("No disabled skills found in the database")

        # 动态获取禁用状态的技能代码
        skill_code = self._get_first_disabled_skill_code()

        # 验证转为草稿和删除按钮可见
        expect(self.page.get_by_test_id(f"btn-to-draft-{skill_code}")).to_be_visible()
        expect(self.page.get_by_test_id(f"btn-delete-{skill_code}")).to_be_visible()

        # 验证发布和禁用按钮不可见
        expect(
            self.page.get_by_test_id(f"btn-publish-{skill_code}")
        ).not_to_be_visible()
        expect(
            self.page.get_by_test_id(f"btn-deactivate-{skill_code}")
        ).not_to_be_visible()

        assert_no_error_message(self.page)
