"""
组织架构页面对象模型
"""

from playwright.sync_api import Locator, Page

from .base_page import BasePage


class OrgStructurePage(BasePage):
    """组织架构页面对象模型."""

    path = "/org-structure"

    @property
    def heading(self) -> Locator:
        """页面标题"""
        return self.get_by_test_id("heading-org-structure").or_(self.page.get_by_role("heading", name="组织架构"))

    @property
    def stat_card_org_count(self) -> Locator:
        """组织单元统计卡片"""
        return self.page.locator("heading:has-text('组织单元')").or_(self.page.locator("p:has-text('组织单元')"))

    @property
    def stat_card_employee_total(self) -> Locator:
        """员工总数统计卡片"""
        return self.page.locator("p:has-text('员工总数')")

    @property
    def stat_card_employee_active(self) -> Locator:
        """在职统计卡片"""
        return self.page.locator("p:has-text('在职')")

    @property
    def stat_card_employee_onboarding(self) -> Locator:
        """入职中统计卡片"""
        return self.page.locator("p:has-text('入职中')")

    @property
    def btn_add_org(self) -> Locator:
        """新增组织按钮"""
        return self.get_by_test_id("btn-add-org").or_(self.page.get_by_role("button", name="新增").or_(self.page.get_by_text("新增")))

    @property
    def btn_add_employee(self) -> Locator:
        """添加员工按钮"""
        return self.get_by_test_id("btn-add-employee").or_(self.page.get_by_role("button", name="添加员工").or_(self.page.get_by_text("添加员工")))

    @property
    def org_tree(self) -> Locator:
        """组织树"""
        return self.page.locator("[data-testid='org-tree']").or_(self.page.locator("ul").filter(has=self.page.locator("p:has-text('组织结构')")))

    @property
    def employee_table(self) -> Locator:
        """员工列表表格"""
        return self.get_by_test_id("table-employee").or_(self.page.get_by_role("table"))

    @property
    def sidebar_org_structure_link(self) -> Locator:
        """侧边栏组织架构链接"""
        return self.page.get_by_role("link", name="组织架构")