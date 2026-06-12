# Neo Chrome Extension

基于 WXT + React 的 Chrome 扩展框架。

## 目录结构

```
├── entrypoints/           # 入口点
│   └── background.ts     # Background Script
├── public/                # 公共资源
│   └── icon/              # 扩展图标
├── assets/                # 静态资源
├── wxt.config.ts          # WXT 配置
├── package.json
└── tsconfig.json
```

## 开发

```bash
# 安装依赖
make install

# 开发模式
make dev

# 构建
make build

# 类型检查
make typecheck

# 代码格式
make format
```

## 添加新功能

1. 在 `entrypoints/` 目录下添加新的入口文件
2. 参考 [WXT 文档](https://wxt.dev/) 配置入口点
