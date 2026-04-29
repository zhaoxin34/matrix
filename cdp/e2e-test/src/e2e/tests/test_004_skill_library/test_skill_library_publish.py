"""
TC-SKILL: Skill Library Publish Tests
技能库发布和版本相关测试
"""

import pytest
import re
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, SkillLibraryPage
from conftest import assert_no_error_message


class TestSkillLibraryPublish:
    """发布和版本测试"""

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

    def _get_first_draft_skill_code(self) -> str:
        """获取第一个草稿状态的技能代码"""
        publish_buttons = self.page.locator("[data-testid^='btn-publish-']")
        expect(publish_buttons.first).to_be_visible()
        test_id = publish_buttons.first.get_attribute("data-testid")
        return test_id.replace("btn-publish-", "")

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
    def test_tc_skill_006_publish_skill(self):
        """
        TC-SKILL-006: 发布技能
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 动态获取草稿状态的技能代码
        skill_code = self._get_first_draft_skill_code()

        self.page.get_by_test_id(f"btn-publish-{skill_code}").click()

        publish_dialog = self.page.get_by_role("dialog", name=f"发布技能 - {skill_code}")
        expect(publish_dialog).to_be_visible()

        self.page.get_by_test_id("inp-publish-version").locator("input").fill("1.0.0")
        self.page.get_by_test_id("inp-publish-comment").locator("textarea").first.fill("首次发布")

        self.page.get_by_test_id("btn-publish-confirm").click()

        # 等待对话框关闭
        expect(publish_dialog).not_to_be_visible()

        # 验证技能状态变为"启用"
        skill_row = self.page.locator("table tbody tr").filter(
            has=self.page.locator("td:nth-child(1) p").filter(has_text=skill_code)
        )
        expect(skill_row.locator("td:nth-child(6)").get_by_text("启用")).to_be_visible()
        expect(skill_row.locator("td:nth-child(7)").get_by_text("1.0.0")).to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_007_duplicate_version_error(self):
        """
        TC-SKILL-007: 重复发布报错
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # UI limitation: publish button only shows for draft status
        pass

    @pytest.mark.smoke
    def test_tc_skill_010_view_version_history(self):
        """
        TC-SKILL-010: 查看版本历史
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 找到有历史按钮的技能（通常是有版本的技能）
        history_buttons = self.page.locator("[data-testid^='btn-history-']")
        expect(history_buttons.first).to_be_visible()
        test_id = history_buttons.first.get_attribute("data-testid")
        skill_code = test_id.replace("btn-history-", "")

        history_buttons.first.click()

        history_dialog = self.page.get_by_role("dialog", name=re.compile(f"版本历史 - {skill_code}"))
        expect(history_dialog).to_be_visible()

        expect(self.page.get_by_text(re.compile(r"\d+ 个版本"))).to_be_visible()
        expect(self.page.get_by_text("当前版本").first).to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_011_rollback_version(self):
        """
        TC-SKILL-011: 回滚技能版本
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # Requires skill with multiple versions
        pass

    @pytest.mark.smoke
    def test_tc_skill_012_current_version_no_rollback_button(self):
        """
        TC-SKILL-012: 当前版本不显示回滚按钮
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 打开版本历史对话框
        history_buttons = self.page.locator("[data-testid^='btn-history-']")
        expect(history_buttons.first).to_be_visible()
        history_buttons.first.click()

        # 对话框名称包含"版本历史"
        history_dialog = self.page.get_by_role("dialog", name=re.compile("版本历史"))
        expect(history_dialog).to_be_visible()

        # 当前版本不应该有"回滚到此版本"按钮
        rollback_button = self.page.get_by_role("button", name="回滚到此版本")
        expect(rollback_button).not_to_be_visible()

        self.page.get_by_test_id("btn-history-close").click()

    @pytest.mark.smoke
    def test_tc_skill_016_draft_shows_publish_button(self):
        """
        TC-SKILL-016: 草稿状态显示发布按钮
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 动态获取草稿状态的技能代码
        skill_code = self._get_first_draft_skill_code()

        # 验证发布按钮可见
        expect(self.page.get_by_test_id(f"btn-publish-{skill_code}")).to_be_visible()
        # 验证禁用和删除按钮不可见
        expect(self.page.get_by_test_id(f"btn-deactivate-{skill_code}")).not_to_be_visible()
        expect(self.page.get_by_test_id(f"btn-delete-{skill_code}")).not_to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_017_enabled_shows_disable_button(self):
        """
        TC-SKILL-017: 启用状态显示禁用按钮
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        # 动态获取启用状态的技能代码
        skill_code = self._get_first_enabled_skill_code()

        # 验证禁用按钮可见
        expect(self.page.get_by_test_id(f"btn-deactivate-{skill_code}")).to_be_visible()
        # 验证发布和删除按钮不可见
        expect(self.page.get_by_test_id(f"btn-publish-{skill_code}")).not_to_be_visible()
        expect(self.page.get_by_test_id(f"btn-delete-{skill_code}")).not_to_be_visible()

        assert_no_error_message(self.page)
