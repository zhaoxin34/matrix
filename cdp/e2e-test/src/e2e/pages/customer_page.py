"""
Customer Page Object Model
"""

from playwright.sync_api import Locator

from .base_page import BasePage


class CustomerPage(BasePage):
    """Customer page object model."""

    path = "/customer"

    @property
    def search_input(self) -> Locator:
        return self.get_by_test_id("inp-customer-search")

    @property
    def search_button(self) -> Locator:
        return self.get_by_test_id("btn-customer-search")

    @property
    def customer_table(self) -> Locator:
        return self.page.get_by_test_id("table-customer-list")

    @property
    def first_customer(self) -> Locator:
        return self.page.get_by_test_id("row-customer-first")

    @property
    def customer_detail(self) -> Locator:
        return self.get_by_test_id("panel-customer-detail")