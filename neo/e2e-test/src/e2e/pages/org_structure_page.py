"""
组织架构页面对象模型
"""

from playwright.sync_api import Locator

from .base_page import BasePage


class OrgStructurePage(BasePage):
    """组织架构页面对象模型."""

    path = "/admin/org-structure"

    @property
    def heading(self) -> Locator:
        """页面标题"""
        return self.get_by_role("heading", name="组织结构")

    @property
    def btn_add_org(self) -> Locator:
        """新增组织按钮"""
        return self.get_by_role("button", name="新增")

    @property
    def btn_add_employee(self) -> Locator:
        """添加员工按钮"""
        return self.get_by_role("button", name="添加员工")

    @property
    def org_tree(self) -> Locator:
        """组织树"""
        return self.page.locator("[data-testid='org-tree'], .org-tree")

    @property
    def employee_table(self) -> Locator:
        """员工列表表格"""
        return self.get_by_role("table")

    @property
    def employee_rows(self) -> Locator:
        """员工表格行"""
        return self.employee_table.locator("tbody tr")

    @property
    def employee_dialog(self) -> Locator:
        """员工对话框"""
        return self.page.get_by_role("dialog", name="添加员工").or_(
            self.page.get_by_role("dialog", name="编辑员工")
        )

    @property
    def user_selector_dialog(self) -> Locator:
        """用户选择器对话框"""
        return self.page.get_by_role("dialog", name="选择用户")

    @property
    def inp_employee_no(self) -> Locator:
        """工号输入框"""
        return self.page.get_by_test_id("inp-emp-no").or_(
            self.page.get_by_placeholder("请输入工号")
        )

    @property
    def inp_employee_name(self) -> Locator:
        """姓名输入框"""
        return self.page.get_by_test_id("inp-emp-name").or_(
            self.page.get_by_placeholder("请输入姓名")
        )

    @property
    def inp_employee_phone(self) -> Locator:
        """手机号输入框"""
        return self.page.get_by_test_id("inp-emp-phone").or_(
            self.page.get_by_placeholder("请输入手机号")
        )

    @property
    def inp_employee_email(self) -> Locator:
        """邮箱输入框"""
        return self.page.get_by_placeholder("请输入邮箱")

    @property
    def inp_employee_position(self) -> Locator:
        """职位输入框"""
        return self.page.get_by_test_id("inp-emp-position").or_(
            self.page.get_by_placeholder("请输入职位")
        )

    @property
    def btn_select_user(self) -> Locator:
        """选择用户按钮"""
        return self.page.get_by_role("button", name="选择用户")

    @property
    def btn_confirm(self) -> Locator:
        """确定按钮"""
        return self.page.get_by_test_id("btn-emp-submit").or_(
            self.get_by_role("button", name="确定")
        )

    @property
    def btn_cancel(self) -> Locator:
        """取消按钮"""
        return self.get_by_role("button", name="取消")

    def open_add_employee_dialog(self) -> None:
        """打开添加员工对话框"""
        self.btn_add_employee.click()
        self.page.wait_for_timeout(500)

    def open_user_selector(self) -> None:
        """打开用户选择器"""
        self.btn_select_user.click()
        self.page.wait_for_timeout(500)

    def select_user_from_list(self, phone: str) -> None:
        """从用户列表中选择用户"""
        # 在用户选择器中查找并选择用户
        self.user_selector_dialog.get_by_text(phone, exact=True).click()
        self.page.wait_for_timeout(300)

    def fill_employee_form(
        self,
        employee_no: str | None = None,
        name: str | None = None,
        phone: str | None = None,
        email: str | None = None,
        position: str | None = None,
    ) -> None:
        """填写员工表单"""
        if employee_no:
            self.inp_employee_no.fill(employee_no)
        if name:
            self.inp_employee_name.fill(name)
        if phone:
            self.inp_employee_phone.fill(phone)
        if email:
            self.inp_employee_email.fill(email)
        if position:
            self.inp_employee_position.fill(position)

    def submit_employee(self) -> None:
        """提交员工表单"""
        self.btn_confirm.click()
        self.page.wait_for_timeout(500)

    def cancel_employee(self) -> None:
        """取消员工表单"""
        self.btn_cancel.click()
        self.page.wait_for_timeout(300)

    def get_employee_by_no(self, employee_no: str) -> Locator:
        """根据工号获取员工行"""
        return self.employee_rows.locator(f"td:first-child:text('{employee_no}')")

    def is_employee_visible(self, employee_no: str) -> bool:
        """检查员工是否可见"""
        try:
            self.get_employee_by_no(employee_no).wait_for(timeout=3000)
            return True
        except Exception:
            return False

    def edit_employee(self, employee_no: str) -> None:
        """编辑员工"""
        row = self.get_employee_by_no(employee_no)
        row.locator("button").first.click()
        self.page.wait_for_timeout(300)

    def delete_employee(self, employee_no: str) -> None:
        """删除员工"""
        row = self.get_employee_by_no(employee_no)
        row.locator("button:text('删除')").or_(
            row.locator("[data-testid='btn-delete']")
        ).click()
        self.page.wait_for_timeout(300)
