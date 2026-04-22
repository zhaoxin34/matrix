# CLAUDE.md

本目录包含 CDP 项目的 E2E 自动化测试，使用 Playwright + pytest。

## 目录结构

```
e2e-test/
├── src/e2e/
│   ├── pages/          # Page Object Model
│   └── tests/          # 测试用例
├── cases/              # 测试用例文档
├── reports/            # Allure 测试报告
├── conftest.py         # pytest 配置和 fixtures
└── Makefile            # 常用命令
```

## 常用命令

```bash
make install      # 安装依赖并下载 Chromium
make test         # 运行所有测试
make test-smoke   # 运行 smoke 测试
make test-slow    # 运行 slow 测试
make dev          # 有界面运行测试
make report       # 生成 Allure 报告
make lint         # 代码检查
make fmt-lint     # 格式化 + 检查
```

## 测试用户信息

- 用户名: 13800138002
- 密码: abcd1234

## 重要模式

### 断言后端错误

使用 `assert_no_error_message(page)` 检查表单提交后是否有后端错误：

```python
from conftest import assert_no_error_message

def test_xxx(page):
    page.click(submit_button)
    page.wait_for_timeout(3000)
    assert_no_error_message(page)  # 后端报错时测试会失败
```

### 测试隔离

每个测试后自动清理 cookies 和 localStorage。如果需要手动清理：

```python
page.context.clear_cookies()
page.evaluate("() => { localStorage.clear(); }")
```

## 注意事项

- 前端必须运行在 `http://localhost:3001`
- 后端必须运行在 `http://localhost:8001`
- 测试使用 session 级别的 browser context，所有测试共享同一浏览器配置
- 每个测试后自动清理 auth state，无需手动处理
