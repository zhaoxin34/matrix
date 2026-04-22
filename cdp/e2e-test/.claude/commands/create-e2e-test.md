---
name: create-e2e-test
allowed-tools: Read, Glob, Bash, Write
description: 根据test-case-file, 创建e2e测试用例
argument-hint: <test-case-file>
---

# E2E 测试计划生成器

根据测试用例文档生成测试计划。

## 参数

- `test-case-file`: 测试用例文档路径


## 示例

`/create-e2e-test test-case-file.md`

如果`test-case-file`不存在, 提示用户后，退出。

step1: 读取test-case-file.md
示例文件：test-case-file.md

```markdown
## 1. module1

### case-001: case-name-001

- **前置条件**: condition1
- **测试步骤**：
  1. step1
  2. step2
  3. step3
- **预期结果**：
  1. result1
  2. result2

### case-002: case-name-002

- **前置条件**: condition2
- **测试步骤**：
  1. step1
- **预期结果**：
  1. result1

## 1. module2

### case-003: case-name-003

- **前置条件**: condition3
- **测试步骤**：
  1. step1
  2. step2
  3. step3
- **预期结果**：
  1. result1
  2. result2
```


step2: 创建一个执行计划放到 `test-case-file`目录下，叫`test-case-file-plan.md`
如果test-case-plan.md文件已经存在了，则跳过这步，进行下一步
格式如下

```markdown
# module1

- [] caes-id-001
- [] caes-id-002

# module2

- [] caes-id-003
```

step3 遍历 `test-case-file-plan.md` 文件中未完成的case，使用skills playwright-cli进行测试

如果playwright-cli执行报错，无论是代码问题，还是测试用例本身有问题，都需要记录一下错误的原因，然后继续执行下一个用例，直至所有用例都创建过或者有错误。最终的执行结果还是存储到`test-case-file-plan.md`

注意：playwright必须指定session，避免session冲突，使用-s=${case-id}的方式可以保证一个case一个session，示例如下
```bash
playwright-cli -s=${case-id} open xxx
```

playwright执行错误的示例

```markdown
# module1

- [x] caes-id-001
- [] caes-id-002
  错误原因：xxxxxxxxxxxxxxxx

# module2

- [x] caes-id-003
```

step3中，如果playwright-cli执行正确, 那么就把测试用例的python代码写入 项目目录./src/e2e/tests/test_{module_name}.py

test_{module_name}.py示例
```python
"""
CDP-REG: User Registration Tests
"""

import pytest
from datetime import datetime
from playwright.sync_api import Page, expect

from e2e.pages import RegisterPage, LoginPage
from conftest import assert_no_error_message


class TestUserRegistration:
    """Test cases for user registration module."""

    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        self.page = page
        self.register_page = RegisterPage(page)
        self.login_page = LoginPage(page)

    @pytest.mark.smoke
    def test_cdp_reg_001_user_success_register(self):
        """
        CDP-REG-001: 用户成功注册

        前置条件：用户未注册
        测试步骤：
            1. 打开浏览器访问 http://localhost:3001/register
            2. 输入用户名、密码、确认密码、邮箱
            3. 点击注册按钮
        预期结果：
            1. 注册成功，跳转到登录页面或显示成功消息
            2. 可以使用注册的账号登录
        """
        # Generate unique user data
        timestamp = int(datetime.now().timestamp())
        username = f"testuser_{timestamp}"
        email = f"{username}@example.com"
        phone = "13800138002"
        password = "Abcd1234"
        sms_code = "123456"  # 验证码是假的，用123456即可

        # Navigate to register page
        self.register_page.navigate()

        # Verify register page loaded
        expect(self.page.get_by_role("heading", name="注册")).to_be_visible()

        # Fill the form
        self.register_page.username_input.fill(username)
        self.register_page.email_input.fill(email)
        self.register_page.phone_input.fill(phone)
        self.register_page.sms_code_input.fill(sms_code)
        self.register_page.password_input.fill(password)
        self.register_page.terms_checkbox.check()

        # Submit registration
        self.register_page.submit_button.click()

        # Wait for response or navigation
        self.page.wait_for_timeout(3000)

        # Assert no backend error occurred
        assert_no_error_message(self.page)

```

页面示例, 注意：未必需要建立Page
```python
"""
Login Page Object Model
"""

from playwright.sync_api import Locator

from .base_page import BasePage


class LoginPage(BasePage):
    """Login page object model."""

    path = "/login"

    @property
    def username_input(self) -> Locator:
        return self.get_by_test_id("inp-login-username")

    @property
    def password_input(self) -> Locator:
        return self.get_by_test_id("inp-login-password")

    @property
    def submit_button(self) -> Locator:
        return self.get_by_test_id("btn-login-submit")

    @property
    def register_link(self) -> Locator:
        return self.page.get_by_role("link", name="立即注册")

    def login(self, username: str, password: str) -> "LoginPage":
        """Login with username and password."""
        self.username_input.fill(username)
        self.password_input.fill(password)
        self.submit_button.click()
        return self
```
