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
├── e2e-test-case/      # e2e 测试用例
│   └── ecommerce/      # 电商demo网站的测试用例
├── ecommerce/          # 电商demo网站
│   ├── backend/        # 后端 (Python FastAPI)
│   └── frontend/       # 前端 (React TypeScript)
├── cdp/                # CDP 平台
│   ├── backend/        # 后端 (Python FastAPI)
│   └── frontend/       # 前端 (React TypeScript)
├── sati/               # AI用户行为模拟器
│   └── src/sati/       # 模拟用户行为，调用 analyst API
└── analyst/             # 数据仓库后端
    └── backend/        # FastAPI 后端 (端口8002)
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

## sati & analyst 数据架构

sati 是 AI 用户行为模拟器，analyst 是数据仓库后端，两者协作完成数据采集。

### 关系图

```
sati (模拟器) ──→ 调用API ──→ analyst (数据仓库后端)
   │                                    │
   │  1. 发送用户动作事件                │  1. 记录事件到 dwd_fact_events
   │  2. 获取 PageState (页面反馈)       │  2. Session 管理
   │  3. 支付时创建订单                  │  3. 计算 PageState
   │                                    │  4. 支付时写入 dwd_fact_orders
   │                                    │
   └────────────────────────────────────┘
              返回 PageState
```

### sati 项目

- **角色**: 数据生产者
- **功能**: 模拟用户行为（浏览、加购、支付等）
- **调用**: `POST http://localhost:8002/api/v1/collect`
- **启动**: `cd sati && make dev`

### analyst 项目

- **角色**: 数据存储+分析
- **功能**: 接收事件、存储数据、返回页面状态
- **端口**: 8002
- **启动**: `cd analyst/backend && make dev`
- **数据库**: analyst (MySQL)
