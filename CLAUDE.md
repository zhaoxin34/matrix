## 项目

**AI Matrix - 电商演示平台**

一个用于研究 AI 自主决策和学习的模拟测试平台。电商平台（演示网站 + CDP）作为一个环境，让 AI 智能体能够观察业务运营、从师徒互动中学习，最终能够独立运作以最大化投资回报率。

这是第一阶段：构建电商平台架构和工程基础。功能开发在后续阶段进行。

**核心价值：** 建立一个稳健、可扩展的架构，支持 AI 研究的快速迭代，同时提供真实的业务模拟数据。

## 目录结构

```
.
├── CLAUDE.md                 # 项目说明文档
├── README.md                 # 项目README
├── .gitignore
├── hooks/                    # Git钩子配置
├── prompts/                  # 项目提示词
├── products/                 # 产品文档
│   └── ecommerce/
├── ecommerce/                # 电商项目
│   ├── backend/              # 后端 (Python FastAPI)
│   │   ├── src/app/
│   │   │   ├── api/          # API路由
│   │   │   ├── core/         # 核心配置
│   │   │   ├── models/       # 数据模型
│   │   │   ├── repositories/ # 数据访问层
│   │   │   ├── schemas/      # Pydantic schemas
│   │   │   ├── services/     # 业务逻辑层
│   │   │   └── utils/        # 工具函数
│   │   ├── tests/            # 测试代码
│   │   ├── scripts/          # 脚本
│   │   └── alembic/          # 数据库迁移
│   └── frontend/             # 前端 (React TypeScript)
│       └── src/
│           ├── api/          # API客户端
│           ├── components/   # 组件
│           ├── hooks/        # React hooks
│           ├── pages/        # 页面
│           ├── stores/       # 状态管理 (Zustand)
│           ├── types/        # TypeScript类型
│           └── utils/        # 工具函数
└── .planning/                # 规划文档
    ├── phases/               # 阶段计划
    ├── milestones/           # 里程碑
    ├── quick/                # 快速任务
    └── research/             # 研究文档
```
