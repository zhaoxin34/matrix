---
name: create-e2e-test-code
allowed-tools: Read, Glob, Bash, Write
description: 根据test-case-file-plan, 创建e2e测试用例代码
argument-hint: <test-case-file-plan>
---

# E2E 测试计划生成器

根据测试用例文档生成测试计划。

## 参数

- `test-case-file-plan`: 测试计划文档路径

## 示例

`/create-e2e-test-code test-case-file-plan.md`

如果`test-case-file-plan`不存在, 提示用户后，退出。

### step1: 读取test-case-file-plan.md

示例文件：test-case-file-plan.md

```markdown
# 用例计划信息

- 用例文档：`test-case-file.md`
- 创建时间：yyyy-MM-dd HH:mm
- 模块数量：x
- 用例数量：x

# module1

## caes-id-001

- [ ] playwright-cli 对齐产品
- [ ] 编写测试用例
- [ ] 验证测试用例是否符合规范
- [ ] 执行并修改测试用例

状态：待执行
失败原因：

## caes-id-002

... 同 case-id-001

# module2

## caes-id-003

... 同 case-id-001
```

### step2 遍历 `test-case-file-plan.md` 文件中第一个`待执行`的case, 按照case步骤执行。执行完毕后，再找到下一个case，知道所有case都被执行过。

case 步骤详解：

#### playwright-cli 对齐产品

获取case的详细测试步骤信息，详细信息需要去用例文档`test-case-file.md`获取

用例详细测试步骤信息示例如下

```
### CDP-HOME-001: 首页正常加载
- **前置条件**：无
- **测试步骤**：打开浏览器访问 http://localhost:3002
- **预期结果**：
  - 页面正确加载
  - 显示平台名称或Logo
  - 导航栏显示主要菜单项
  - 页面包含核心功能入口
```

使用playwright-cli访问执行步骤中的操作，如`playwright-cli open http://localhost:3002`, 理解用例中的要求，评估一下用例是否合理，如果出现阻断性问题，比如页面打不开、功能未实现等，则结束本用例的测试，修改`test-case-file-plan.md` 对应的case处的状态和失败原因

```
状态：失败
失败原因：xxxxxxxxxx
```

如果你判断测试用例和产品功能匹配，实现良好，则把该步骤标记完成 `- [x] xxxxxxx`, 进入下一步

#### 编写测试用例

把测试用例的python代码写入 项目目录`./src/e2e/tests/test_00x_{module_name}.py`

`test_00x_{module_name}.py`示例

> 注意 test_00x 中的00x，是001、002、003 这样的文字，表示执行的顺序，因为一般测试用例都需要有个执行的顺序

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

页面示例, 注意：Page可以已被创建，比如LoginPage这种页面很可能在之前的测试用例创建过程中已经存在，则无须再次创建

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

完成后，标记步骤未完成，`- [x] 编写测试用例
`

#### 验证测试用例是否符合规范

验证一下刚才写的测试用例代码是不是使用了get_by_test_id获取元素，如果不是，是不是页面元素本身没有`test-id`, 如果页面元素提供了`test-id`, 则必须使用`get_by_test_id`

完成后，标记步骤未完成， `- [x] 验证测试用例是否符合规范`

#### 执行并修改测试用例

执行测试用例代码
`pytest src/e2e/tests/test_00x_{module_name}.py`

如果有错误，就修改测试用例代码，期间如果需要，可以使用playwright-cli访问页面，诊断问题。

完成后，标记步骤未完成， `- [x] 执行并修改测试用例`

### 用例步骤错误处理

执行
`playwright-cli 对齐产品`
`编写测试用例`
`验证测试用例是否符合规范`
`执行并修改测试用例`
这些步骤都可能发生阻塞性问题，如果发生，则修改用例状态, 如下所示

```
状态：失败
失败原因：xxxxxxxxxx
```

### 用例步骤成功

如果用例执行成功，则修改状态如下

```
状态：成功
失败原因：
```
