"""
Skill Library Page Object Model
"""

from playwright.sync_api import Locator, Page

from .base_page import BasePage


class SkillLibraryPage(BasePage):
    """Skill Library page object model."""

    path = "/skill-library"

    @property
    def search_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="搜索技能代码/名称")

    @property
    def level_filter(self) -> Locator:
        return self.page.get_by_role("combobox", name="级别")

    @property
    def status_filter(self) -> Locator:
        return self.page.get_by_test_id("sel-status-filter").locator("[role=combobox]").first

    @property
    def add_skill_button(self) -> Locator:
        return self.page.get_by_test_id("btn-skill-add")

    @property
    def skill_name_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="技能名称")

    @property
    def skill_author_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="作者")

    @property
    def skill_code_input(self) -> Locator:
        return self.page.get_by_role("textbox", name="技能代码")

    @property
    def skill_table(self) -> Locator:
        return self.page.locator("table")

    @property
    def pagination_info(self) -> Locator:
        return self.page.get_by_text("每页行数")

    def navigate(self) -> "SkillLibraryPage":
        """Navigate to skill library page."""
        self.page.goto(self.url)
        return self
