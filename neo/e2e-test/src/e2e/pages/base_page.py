"""
Base Page Object Model
"""

from typing import Literal

from playwright.sync_api import Locator, Page


class BasePage:
    """Base page object model with common functionality."""

    def __init__(self, page: Page, path: str = ""):
        self.page = page
        self.path = path

    def navigate(self, path: str | None = None):
        """Navigate to the page."""
        url = path or self.path
        self.page.goto(url)
        self.page.wait_for_load_state("networkidle")

    def get_by_test_id(self, test_id: str) -> Locator:
        """Get element by test ID."""
        return self.page.get_by_test_id(test_id)

    def get_by_role(
        self,
        role: Literal[
            "alert",
            "alertdialog",
            "application",
            "article",
            "banner",
            "blockquote",
            "button",
            "caption",
            "cell",
            "checkbox",
            "code",
            "columnheader",
            "combobox",
            "complementary",
            "contentinfo",
            "definition",
            "deletion",
            "dialog",
            "directory",
            "document",
            "emphasis",
            "feed",
            "figure",
            "form",
            "generic",
            "grid",
            "gridcell",
            "group",
            "heading",
            "img",
            "insertion",
            "link",
            "list",
            "listbox",
            "listitem",
            "log",
            "main",
            "marquee",
            "math",
            "menu",
            "menubar",
            "menuitem",
            "menuitemcheckbox",
            "menuitemradio",
            "meter",
            "navigation",
            "none",
            "note",
            "option",
            "paragraph",
            "presentation",
            "progressbar",
            "radio",
            "radiogroup",
            "region",
            "row",
            "rowgroup",
            "rowheader",
            "scrollbar",
            "search",
            "searchbox",
            "separator",
            "slider",
            "spinbutton",
            "status",
            "strong",
            "subscript",
            "superscript",
            "switch",
            "tab",
            "table",
            "tablist",
            "tabpanel",
            "term",
            "textbox",
            "time",
            "timer",
            "toolbar",
            "tooltip",
            "tree",
            "treegrid",
            "treeitem",
        ],
        name: str | None = None,
        **kwargs,
    ) -> Locator:
        """Get element by role."""
        if name:
            return self.page.get_by_role(role, name=name, **kwargs)
        return self.page.get_by_role(role, **kwargs)

    def get_by_text(self, text: str, **kwargs) -> Locator:
        """Get element by text."""
        return self.page.get_by_text(text, **kwargs)

    def locator(self, selector: str) -> Locator:
        """Get element by CSS selector."""
        return self.page.locator(selector)

    def wait_for_timeout(self, timeout: int = 500):
        """Wait for a specified time in milliseconds."""
        self.page.wait_for_timeout(timeout)

    @property
    def url(self) -> str:
        """Get current page URL."""
        return self.page.url
