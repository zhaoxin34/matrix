"""
TC-SKILL: Skill Library List Tests
技能库列表相关测试：显示、筛选、搜索、分页
"""

import pytest
from playwright.sync_api import Page, expect

from e2e.pages import LoginPage, SkillLibraryPage
from conftest import assert_no_error_message


class TestSkillLibraryList:
    """技能库列表显示和操作测试"""

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
    def test_tc_skill_001_skill_list_display(self):
        """
        TC-SKILL-001: 技能列表显示
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        table = self.page.locator("table")
        expect(table).to_be_visible()

        headers = self.page.locator("table thead th")
        expected_headers = ["技能代码", "技能名称", "级别", "标签", "作者", "状态", "版本", "创建时间", "操作"]
        header_texts = headers.all_text_contents()

        for expected in expected_headers:
            assert any(expected in text for text in header_texts), f"Missing column: {expected}"

        expect(self.page.get_by_text("每页行数")).to_be_visible()

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_002_filter_by_status(self):
        """
        TC-SKILL-002: 按状态筛选技能
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        self.skill_library_page.status_filter.click()
        self.page.get_by_role("option", name="草稿").click()

        status_cells = self.page.locator("table tbody tr td:nth-child(6)")
        expect(status_cells.first).to_be_visible()
        status_texts = status_cells.all_text_contents()
        for status in status_texts:
            assert "草稿" in status, f"Expected '草稿' but found '{status}'"

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_003_search_skill(self):
        """
        TC-SKILL-003: 搜索技能
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        search_input = self.page.get_by_role("textbox", name="搜索技能代码/名称")
        search_input.fill("test")

        rows = self.page.locator("table tbody tr")
        expect(rows.first).to_be_visible()
        count = rows.count()
        assert count > 0, "No results found for search keyword"

        found = False
        for i in range(count):
            row_text = rows.nth(i).text_content()
            if "test" in row_text.lower():
                found = True
                break
        assert found, "Search results do not contain keyword"

        assert_no_error_message(self.page)

    @pytest.mark.smoke
    def test_tc_skill_020_pagination(self):
        """
        TC-SKILL-020: 分页功能
        """
        self._login()
        self.skill_library_page.navigate()
        self.page.wait_for_load_state("networkidle")

        expect(self.page.get_by_text("每页行数")).to_be_visible()
        expect(self.page.get_by_text("1").first).to_be_visible()

        assert_no_error_message(self.page)
