# Neo - AI协作平台

Neo是一个AI协作平台，目标实现借助AI的能力完成自学习、自组织、自决策的能力。平台让人和AI协同工作，自动组织成完成某个事项，让人和AI互相学习，最终可以让AI决策大多数事项。

# 项目结构

```
./design             neo项目的产品设计文档存放的目录
./ui                 neo项目的高保真原型UI存放的目录
./backend            后端服务 (Python FastAPI, 端口8000)
./frontend           前端应用 (Next.js TypeScript, 端口3000)
./agent-steer   Chrome扩展程序 (Vite TypeScript)
./e2e-test/   e2e 测试用例工程
```

## 技术栈

| 模块 | 技术栈 | 说明 |
|------|--------|------|
| backend | Python + FastAPI | REST API后端服务 |
| frontend | Next.js + React + TypeScript | Web前端应用 |
| agent-steer | Vite + TypeScript + rrweb | 浏览器录制扩展 |
| design | Excalidraw | 产品设计文档 |
| ui | React + shadcn/ui | 高保真原型 |
| e2e-test | Python + Playwright | 测试用例工程 |

## 模块启动地址和端口号
| 模块 | 启动地址 |
|------|--------|
| backend | localhost:8000 | 
| frontend | localhost:3000 |
| design | localhost:3200 |
| ui | localhost:3300|

## 核心功能

- **工作区**: 人和AI工作实体的容器，包含目录、工具、数据源、服务、沙箱环境、聊天等
- **知识库**: 结构化知识、文档知识、经验知识、推理知识的管理
- **人机配合**: 人与AI协同工作的能力

# 工作流程

1. 在design目录下完成产品设计
2. 根据design的设计完成UI的高保真设计，存放到ui目录
3. 根据design的设计和ui的原型开发前后端项目

# 技术规范

以下技术规范必须遵守

- 前端规范：.pi/rules/rules-frontend.md
- API规范：.pi/rules/rules-api.md

# 开发指导

## 测试的用户信息

username: 13800138002
password: abcd1234

## 开发数据库信息

db: neo
host: 127.0.0.1
port: 3306
user: root
password: root

如果neo 这个db不存在，则创建

## Chrome Extension 开发指南

### 模块说明

| 模块 | 文件 | 功能 |
|------|------|------|
| recorder | src/content/recorder.ts | rrweb 录制控制 |
| operator | src/content/operator.ts | DOM 操作执行 |
| overlay | src/content/overlay.ts | Shadow DOM 遮罩 |
| iframe-manager | src/content/iframe-manager.ts | iframe 管理 |
| storage | src/content/storage.ts | IndexedDB 存储 |
| config | src/content/config.ts | 配置持久化 |

### 开发命令

```bash
# 安装依赖
make install

# 开发模式构建
make dev

# 生产构建
make build

# 运行单元测试
make test:run

# 运行测试（watch）
make test

# 类型检查
make typecheck

# 代码格式
make format

# 加载扩展到 Chrome
make load
```

### 测试用户

同 Neo 平台：13800138002 / abcd1234

### 调试方法

1. 在 Chrome 打开 `chrome://extensions/`
2. 找到 Neo Agent 扩展，点击 "Service Worker" 链接查看后台日志
3. 在页面右键 → 检查 → Console 查看 content script 日志
4. 扩展 popup 调试：右键 popup → 检查弹出内容
