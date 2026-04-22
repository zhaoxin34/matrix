# CDP E2E Test Framework

基于 Playwright 的 CDP 平台 E2E 测试框架。

## 项目结构

```
cdp/e2e-test/
├── pyproject.toml           # uv 项目配置
├── Makefile                 # 构建命令
├── pytest.ini               # pytest 配置
├── conftest.py              # pytest 全局 fixture
├── src/e2e/                 # 源代码
│   ├── conftest.py          # 页面 fixture
│   ├── pages/               # 页面对象模型
│   ├── tests/               # 测试用例
│   └── utils/               # 工具函数
└── tests/                   # 测试入口（兼容 pytest 发现）
    └── test_e2e.py
```

## 快速开始

### 1. 安装依赖

```bash
make install
```

### 2. 运行测试

```bash
# 运行非慢速测试
make test

# 运行所有测试
make test-slow

# 运行冒烟测试
make test-smoke

# 有头模式（可视化）
make dev
```

### 3. 生成报告

```bash
make report      # 生成 Allure 报告
make open-report  # 打开报告
```

## 测试用户信息

- Username: 13800138002
- Password: abcd1234


## 定位器策略

优先使用语义化定位器：
- `data-testid` - 测试 ID 属性
- `role` - ARIA 角色
- `text` - 文本内容
- `label` - 表单标签

避免使用 uid（如 e37, e48）等易变的定位器。
