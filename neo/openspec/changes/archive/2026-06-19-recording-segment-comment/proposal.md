# Change: recording-segment-comment

## Why

录像回放目前只能"看"，无法承载"为什么这样做"的决策上下文。在师徒带教、知识沉淀、问题复盘等场景下，回放者常常不理解录像中某一步操作的意图（例如"为什么选择这群用户画像"）。我们需要一个**附着在录像片段（segment）某个时段上的标注能力**——当回放播放到该时段时展示标注，走出时隐藏——让老师能够把自己的解读留在录像里，让其他回放者带着上下文理解录像内容。

## What Changes

- 新增 `recording-segment-comment` 资源（录像标注），归属 `recording` 与 `segment`
- 后端：
  - 新增 `recording_segment_comment` 表（FK 级联删除至 recording/segment）
  - 新增 6 个 REST API：创建、列表（按 recording）、列表（按 segment）、更新、删除、批量删除
  - 时间字段 `show_time` / `hide_time` 使用相对 segment 起点的偏移秒数（`DECIMAL(10,3)`，毫秒级精度）
- 前端：
  - 回放页右侧 Segments 列表改为**展开嵌入**式：选中 Segment 卡片下方**叠放**标注面板
  - 播放器控制条新增 `+标注` 入口（同时在右侧面板底部提供冗余入口）
  - rrweb 画布在播放到标注时段时弹出可堆叠的气泡卡，hover 侧栏列表项时高亮对应气泡
  - rrweb-player 进度条上方叠加彩色标注区间色块（按创建者配色）
- 权限：
  - 列表查询：所有 Workspace 成员可见
  - 创建：Admin 或 Owner
  - 编辑/删除：仅创建者本人或 Workspace Owner
- 不引入新的存储后端；标注数据全部存储在 MySQL，不写 S3
- 不改变现有 Recording / Segment 的数据模型与 API 行为（**非破坏性变更**）

## Capabilities

### New Capabilities

- `recording-segment-comment`: 录像标注能力——对录像片段的某个时段添加摘要 + 详情标注，回放时按时间段联动展示

### Modified Capabilities

无。现有 `recording-playback` 与 `recording-management` 的**需求级行为未变更**；本变更只在前端增强 UI 与新增独立资源，不修改既有 spec 中的 Requirement。

> 备注：`recording-playback` 后续可能需要追加"播放到标注时段联动气泡"作为新 Requirement，但这是**新加 Requirement** 而不是修改现有 Requirement，因此在变更期不需 delta spec。归档时可一并更新。

## Impact

**后端（FastAPI + SQLAlchemy + Alembic）**

- 新增模型：`backend/src/app/models/recording_segment_comment.py`
- 新增 schema：`backend/src/app/schemas/recording_segment_comment.py`
- 新增 service：`backend/src/app/services/recording_segment_comment_service.py`
- 新增路由：`backend/src/app/api/v1/recording_segment_comments.py`（注册到 `api/v1/__init__.py`）
- 新增迁移：`backend/alembic/versions/<date>_create_recording_segment_comment_table.py`
- 复用现有 Workspace 权限中间件（无需新增）
- 现有代码无破坏性改动

**前端（Next.js + React）**

- 复用既有录像回放页（`frontend/app/workspace/[code]/agent-steer/recording/play/`）
- 新增组件：
  - `RecordingSegmentCommentsPanel`（叠放面板）
  - `RecordingCommentDialog`（新建/编辑弹窗）
  - `RecordingCommentCanvasOverlay`（画布气泡）
  - `RecordingCommentTimelineMarkers`（进度条色块）
- 新增 store 子树：`comments`（bySegment / activeIds / highlightedId / dialog）
- 新增 API 封装：`frontend/lib/api/recording-comment.ts`
- 现有录像 API 客户端无破坏性改动

**数据库**

- 新增 1 张表 `recording_segment_comment`（11 字段 + 4 索引 + 2 CHECK 约束）
- 不修改任何现有表结构

**依赖**

- 后端：无新增依赖（复用 `uuid`、`decimal`、`sqlalchemy`）
- 前端：无新增依赖（复用 shadcn/ui、zustand/store 模式）

**关联设计文档（已先行产出，作为本变更的前置输入）**

- 产品设计：`design/docs/product/workspaces/recording.md` 第 7.2-7.7 节
- 技术设计：`design/docs/technical/workspaces/recording-segment-comment.md`
