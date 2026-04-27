## Why

技能库的内容字段存储 Markdown 格式的技能文档，当前使用普通 TextArea 编辑，无法预览格式效果，编辑体验差。技能内容通常包含标题、列表、代码块等结构化内容，需要一个支持实时预览的 Markdown 编辑器来提升创作效率。

同时，当前 `is_active` 布尔字段无法表达"草稿"状态，需要细化为 `status` 字段支持 draft / active / disabled 三态管理。

## What Changes

- 新增 `@uiw/react-md-editor` 依赖，提供 Markdown 编辑器组件
- 新建技能流程拆分为两步：
  - Step 1：填写基本信息（code, name, level, tags, author），保存为 `draft` 状态
  - Step 2：填写 Markdown 内容，完成后状态变为 `active`
- 移除 `is_active` 字段，新增 `status` 字段（枚举值：draft, active, disabled）
- 编辑功能拆分为两个独立入口：
  - "编辑基本信息"：打开表单 Dialog，保存后状态保持 `draft`
  - "编辑内容"：打开 Markdown 编辑器 Dialog，保存后状态变为 `active`
- 技能详情页的 content 字段从纯文本改为 Markdown 渲染展示（使用 `react-markdown`）
- 状态机：
  - `draft` → `active`：内容编辑完成后
  - `active` → `disabled`：禁用操作
  - `disabled` → `active`：启用操作

## Capabilities

### New Capabilities

- `skill-status`：技能状态管理，支持 draft/active/disabled 三态转换
- `skill-markdown-editor`：Markdown 编辑能力，包含实时预览和工具栏

### Modified Capabilities

- `skill-crud`：新增 `status` 字段替换 `is_active`，创建时默认 status 为 draft
- `skill-list`：筛选条件增加 status 过滤，替换 is_active 筛选

## Impact

- **前端依赖**：新增 `@uiw/react-md-editor`、`react-markdown`
- **数据库**：`skill` 表 `is_active` 列替换为 `status` 列（需迁移）
- **API**：`Skill` 响应结构中 `is_active` 变更为 `status`
- **前端页面**：
  - 新建技能 Dialog 改为 Wizard 两步流程
  - 列表操作栏"启用/禁用"按钮改为"编辑基本信息"+"编辑内容"
  - 详情 Drawer 的 content 使用 Markdown 渲染
