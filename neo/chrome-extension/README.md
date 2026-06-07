# Neo Agent Chrome 扩展程序

Neo Agent AI 平台的 Chrome 扩展程序（Manifest V3）。

## 功能特性

### Phase 1: 核心功能 ✅

- **rrweb 会话录制**：录制用户交互行为，包括点击、输入、导航等事件
- **AI 智能体模式**：
  - **Learn模式**：录制用户行为，保存到本地存储
  - **Guide 模式**：引导用户完成特定任务
  - **Active 模式**：AI 自主决策执行
- **Shadow DOM 悬浮层**：非侵入式录制指示器，显示录制状态和时长
- **前端 iframe 集成**：通过 iframe 嵌入 Neo 前端（端口 3300）
- **IndexedDB 本地存储**：离线优先，录制数据本地存储
- **模块化 Content Script**：recorder、operator、overlay、iframe-manager、storage 五个模块

### Phase 2: 规划中

- [ ] Background消息路由
- [ ] 任务调度器
- [ ] 数据同步到后端
- [ ] 录制回放功能

## 技术栈

- TypeScript
- Vite 5 + vite-plugin-crx
- Manifest V3
- rrweb 录制
- IndexedDB（idb）存储

## 快速开始

```bash
# 安装依赖
make install

# 开发模式构建（监听文件变化）
make dev

# 生产环境构建
make build

# 加载到 Chrome
make load
```

## 手动安装

1. 运行 `make build`
2. 打开 Chrome，访问 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 目录

## 项目结构

```
chrome-extension/
├── src/
│   ├── manifest.ts        # MV3 manifest 配置
│   ├── background/        # Service Worker（后台脚本）
│   │   └── index.ts       # 消息路由、离线队列
│   ├── content/           # Content Script（内容脚本）
│   │   ├── index.ts       # 主入口，整合所有模块
│   │   ├── recorder.ts    # rrweb 录制模块
│   │   ├── operator.ts    # DOM 操作执行模块
│   │   ├── overlay.ts     # Shadow DOM 遮罩模块
│   │   ├── iframe-manager.ts # iframe 管理模块
│   │   ├── storage.ts     # IndexedDB 存储模块
│   │   └── config.ts      # 配置持久化模块
│   ├── shared/            # 共享类型和工具函数
│   │   ├── types.ts       # 消息类型、Agent模式枚举
│   │   └── utils.ts       # 日志、节流、防抖工具
│   └── extension/         # 弹窗和选项页面 UI
│       └── popup.ts       # 扩展弹窗 UI
├── public/                # 静态资源
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 模块说明

### Content Script 模块

| 模块 | 功能 |
|------|------|
| `recorder.ts` | rrweb 录制控制，支持开始/停止/暂停/恢复 |
| `operator.ts` | DOM 操作执行，支持 click/input/submit/navigate |
| `overlay.ts` | Shadow DOM 录制指示器，显示录制状态 |
| `iframe-manager.ts` | iframe 创建和通信管理 |
| `storage.ts` | IndexedDB 录制数据存储 |
| `config.ts` | chrome.storage.local 配置持久化 |

### 通信机制

- **chrome.runtime.sendMessage**：Background ↔ Content Script
- **postMessage**：Content Script ↔ iframe
- **离线队列**：Background 维护离线消息队列，网络恢复后重试

## 测试用户

- Username: 13800138002
- Password: abcd1234

## 开发命令

| 命令 | 说明 |
|------|------|
| `make install` | 安装依赖 |
| `make dev` | 监听模式构建 |
| `make build` | 生产环境构建 |
| `make lint` | 运行 ESLint 检查 |
| `make format` | 代码格式化 |
| `make typecheck` | TypeScript 类型检查 |
| `make clean` | 清理构建产物 |

## 前端地址

- Neo 前端：localhost:3300
- Neo 后端：localhost:8000
- Analyst（数据仓库）：localhost:8002