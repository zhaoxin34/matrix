# Neo Agent Chrome 扩展程序

Neo Agent AI 平台的 Chrome 扩展程序（Manifest V3）。

## 功能特性

- **会话录制**：使用 rrweb 录制用户交互行为
- **AI 智能体模式**：学习模式、引导模式和主动模式
- **Shadow DOM 悬浮层**：非侵入式录制指示器
- **前端集成**：嵌入式 iframe 通信

## 技术栈

- TypeScript
- Vite 5 + vite-plugin-crx
- Manifest V3
- rrweb 录制
- IndexedDB 存储

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
│   ├── content/           # Content Script（内容脚本）
│   ├── shared/ # 共享类型和工具函数
│   └── extension/         # 弹窗和选项页面 UI
├── public/                # 静态资源
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 通信机制

- **postMessage**：iframe 内外通信
- **BroadcastChannel**：Content Script 与 Service Worker 通信

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