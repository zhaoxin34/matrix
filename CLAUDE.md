## 项目

**AI Matrix - 电商演示平台**

一个用于研究 AI 自主决策和学习的模拟测试平台。电商平台（演示网站 + CDP）作为一个环境，让 AI 智能体能够观察业务运营、从师徒互动中学习，最终能够独立运作以最大化投资回报率。

这是第一阶段：构建电商平台架构和工程基础。功能开发在后续阶段进行。

**核心价值：** 建立一个稳健、可扩展的架构，支持 AI 研究的快速迭代，同时提供真实的业务模拟数据。

## 目录结构

```
.
├── CLAUDE.md            # 项目说明文档
├── README.md
├── .gitignore
├── hooks/               # Git钩子配置
├── prompts/            # 项目提示词
├── products/           # 产品文档
├── e2e-test-case/           # e2e 测试用例存放位置
│   ├── ecommerce/        # 电商demo网站的测试用例
├── ecommerce/          # 电商demo网站的代码库
│   ├── backend/        # 后端 (Python FastAPI)
│   └── frontend/       # 前端 (React TypeScript)
├── cdp/                # CDP 平台的代码库
│   ├── backend/        # 后端 (Python FastAPI)
│   └── frontend/       # 前端 (React TypeScript)
└── .planning/          # 规划文档
```

## ecommerce 电商demo网站

### 测试的用户信息

username: 13800138002
password: abcd1234

### 前后端项目

前端项目 ./ecommerce/frontend/
启动命令 make dev, 详见./ecommerce/frontend/Makefile

前端项目 ./ecommerce/backend/
启动命令 make dev, 详见./ecommerce/backend/Makefile

## CDP 平台

### 测试的用户信息

username: 13800138002
password: abcd1234

### 前后端项目

前端项目 ./cdp/frontend/
启动命令 make dev, 详见./cdp/frontend/Makefile

前端项目 ./cdp/backend/
启动命令 make dev, 详见./cdp/backend/Makefile
