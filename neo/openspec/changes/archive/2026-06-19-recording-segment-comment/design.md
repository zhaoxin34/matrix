# Design: recording-segment-comment

## Context

### Background

录像回放（`recording-playback` 能力）目前只承载"操作序列回放"——用户能看到每一步 UI 操作，但无法看到"为什么这样做"的决策上下文。师徒带教、知识沉淀、问题复盘等场景急需"老师讲解 + 学生回放"的承载能力。本变更引入 `recording-segment-comment` 资源，让用户可以在录像片段的某个时段留下说明性标注，并让所有回放者在播放到该时段时看到这些标注。

### Current State

- 已存在录像回放页面（左侧 rrweb 画布 + 右侧 Segments 列表 + 底部控制条）
- 已存在 `recording` 与 `segment` 两张表，FK 级联已建立
- 已存在 Workspace 权限模型（OWNER / ADMIN / MEMBER / GUEST 四级）
- 已存在 FastAPI + SQLAlchemy + Alembic + Next.js 的统一技术栈

### Constraints

1. **零破坏性**：不修改 `recording` / `segment` 任何字段；不修改现有任何 API 行为
2. **跨 segment 一致性**：标注的 `show_time` / `hide_time` 必须使用**相对 segment 起点的偏移秒数**，这样未来 segment 拼接合并时标注无需迁移
3. **权限三段式**：列表查询宽松、写操作严格（仅创建者 + Owner）
4. **复用既有 Workspace 中间件**：不引入新的权限层

### Stakeholders

- **Workspace Admin/Owner**：主要使用者（创建/编辑/删除标注）
- **Workspace Member/Guest**：受益者（回放时看到他人标注）
- **回放者（含未来的 AI Agent）**：消费标注的展示联动

---

## Goals / Non-Goals

### Goals

1. 完整的标注 CRUD API（创建、列表按录像、列表按 segment、更新、删除、批量删除）
2. 录像回放页 UI 增强：Segment 卡片展开嵌入标注面板 + 画布气泡堆叠 + 进度条色块
3. 播放联动：`currentTime` 监听驱动标注 active/inactive 状态切换
4. 跳转定位：点击侧栏标注项跳转至 `show_time`
5. 进度条可视化：标注区间色块按创建者着色
6. 权限模型：列表开放、写操作 creator/Owner 严格
7. 级联删除：删除 recording/segment 自动级联删除标注

### Non-Goals

1. 标注互动（@提及、点赞、回复）—— 留待后续迭代
2. 标注编辑历史（versioning / revision）—— 当前只保留最新
3. 跨 segment 标注 —— 当前强制单 segment 归属
4. 标注全文搜索 —— 暂不需要（标注数量少）
5. 通知推送（被标注 / 被回复）—— 留待后续迭代
6. 标注导入/导出 —— 暂不需要

---

## Decisions

### Decision 1: 时间字段用相对 segment 起点的偏移秒数

**选择**：`show_time` / `hide_time` 字段使用 `DECIMAL(10,3)`，表示相对 Segment 起点的偏移秒数（毫秒级精度）。

**Rationale**：

- 未来若 segment 拼接合并，标注无需迁移（绝对时间戳方案需要全量重算）
- 跨 segment 复用一个 record 也无需重新校时
- 调试更直观（标注时间 = 在 segment 内的播放位置）

**Alternatives Considered**：

- 绝对时间戳（`TIMESTAMP`）：语义直观但跨 segment 迁移代价大
- 整秒（`INT`）：精度不足，标注颗粒感重

### Decision 2: 标注作为独立表（不嵌入 Segment JSON 字段）

**选择**：新建 `recording_segment_comment` 表，与 `segment` 表通过 FK 关联。

**Rationale**：

- 标注需独立查询（按创建人、按时间范围）、独立权限校验、独立统计
- 标注体量可能持续增长，独立表便于加索引（如 `(segment_id, show_time)`）
- 已有 `recording` 表 JSON 字段存 `tags` 的实践表明：JSON 字段不适合频繁过滤/排序

**Alternatives Considered**：

- 嵌入 `segment.page_urls` JSON：写入简单但查询、过滤、统计困难
- 单独 MongoDB collection：引入新存储依赖，不符合"不引入新依赖"原则

### Decision 3: Segment 卡片"展开嵌入"叠放（vs 独立侧栏 / Tab 切换）

**选择**：保留右侧 Segments 列表，选中 Segment 卡片下方**纵向叠放**标注面板，共享卡片视觉边界。

**Rationale**：

- 标注天然归属 Segment，叠放强化归属关系，无需二次"选 segment"步骤
- 不破坏既有 Segments 列表结构（用户已习惯）
- 视觉边界共享降低信息密度跳变感

**Alternatives Considered**：

- 独立右侧侧栏：布局冲击大、列表与 segment 失去视觉锚点
- Tab 切换：每次回看标注都要切 Tab，操作繁琐

### Decision 4: 权限校验放在 Service 层（creator_id 显式校验）

**选择**：列表查询无 creator 校验；写操作（update/delete）在 Service 层显式比对 `comment.creator_id == current_user_id OR user.role == Owner`。

**Rationale**：

- 标注权限是领域级规则（"作者可改可删"），不应硬塞进通用 Workspace 中间件
- Service 层显式校验便于单元测试与审计
- 不引入新的权限抽象（如 ABAC），保持简洁

**Alternatives Considered**：

- 通用 Workspace 中间件 + role 字段：抽象过度、增加学习成本
- 行级安全（RLS）：MySQL 8 才支持，部署复杂度上升

### Decision 5: 进度条色块按 creator_id 配色（确定性 hash）

**选择**：进度条上每个标注的色块颜色由 `creator_id` 通过确定性 hash 映射到一组预定义的调色板索引。

**Rationale**：

- 同一录像中每个用户的标注颜色稳定（跨刷新跨设备一致）
- 无需为标注存颜色字段，节省存储
- 8-12 色就够用，调色板保持一致性可访问性（避免红绿色盲混淆）

**Alternatives Considered**：

- 随机配色：刷新就变，违反稳定性
- 用户自定义：增加 UI 复杂度，无明显收益

### Decision 6: 批量删除采用"逐条校验失败跳过"策略

**选择**：批量删除请求逐条检查权限，跳过失败项并返回 `{deleted_count, skipped: [...]}`。

**Rationale**：

- 用户友好：批量操作时部分权限不足不应整体失败
- 与"写操作 creator 严格"原则一致
- 调用方可根据 skipped 列表给用户提示

**Alternatives Considered**：

- 全有或全无：用户体验差，一次失败全部回滚
- 拆为多次单删：API 请求次数多，无必要

---

## Risks / Trade-offs

### Risk 1: `currentTime` 高频更新导致 UI 卡顿

**Risk**：rrweb-player 的 `currentTime` 可能每帧更新（≥60fps），每次都触发 React 重渲染会卡顿。

**Mitigation**：

- `activeIds` 用 `useMemo` 派生，依赖 `currentTime` + 当前 segment 的 comments
- `currentTime` 用 `requestAnimationFrame` 节流到 ~10fps 进入 store
- 进度条色块用 SVG 而非 React 组件（DOM 节点数少）
- `currentSegmentComments` 只在 segment 切换时变更，播放期间稳定

### Risk 2: 跨 segment 切换时 active 状态需重算

**Risk**：标注是相对 segment 起点，segment 切换后需要重新计算 active，不能简单沿用 `currentTime`。

**Mitigation**：

- segment 切换时同步触发 `comments.bySegment` 切换
- 计算 active 时用 `currentSegmentElapsed = currentTime - segment.startOffset`
- 维护 `currentSegmentUid` 作为依赖项

### Risk 3: 多人并发编辑同一标注

**Risk**：两个用户同时打开同一标注的编辑弹窗，可能产生 lost update。

**Mitigation**：

- 当前策略：**last-write-wins**（不锁、不冲突检测）
- 编辑弹窗打开时拉取最新版本，保存时无版本号比对
- 已知 trade-off：极端并发下可能丢失更新，但标注是轻量说明性内容，可接受
- 未来可加 `updated_at` 乐观锁（升级 spec 时再处理）

### Risk 4: rrweb-player 进度条叠加层可能影响美观 / 交互

**Risk**：在 rrweb-player 自带进度条上方叠加色块可能与官方样式冲突，或遮挡交互。

**Mitigation**：

- 用绝对定位的浮动层（`position: absolute; top: -8px`）而不修改 rrweb-player DOM
- 浮动层 `pointer-events: none` 不阻塞进度条拖拽
- 颜色透明 0.6，hover 时提示具体标注数

### Risk 5: 颜色配色可能降低可访问性

**Risk**：按 creator 配色可能对色盲用户不友好。

**Mitigation**：

- 调色板预选对色盲友好的色系（如 Okabe-Ito 8 色）
- 色块右侧可加 creator 名字首字母作为辅助标识
- 列表项已有头像 + 名字，纯色块只是辅助可视化

### Risk 6: 长录像标注数量大时 API 返回体过大

**Risk**：单次 list 接口返回整录像所有标注，理论上可能上百条。

**Mitigation**：

- API 支持分页（`page` / `size`，默认 size=50）
- 前端按需缓存（segment 切换时只请求该 segment 的标注）
- 实际数据观察：标注密度通常 < 0.1 条/分钟，5 分钟录像 < 1 条

---

## Migration Plan

### 数据库迁移

```bash
cd backend
alembic upgrade head  # 应用 recording_segment_comment 表创建迁移
alembic downgrade -1  # 回滚（删除该表）
```

迁移脚本（`backend/alembic/versions/<date>_create_recording_segment_comment_table.py`）：

- 创建 `recording_segment_comment` 表（11 字段 + 4 索引 + 2 CHECK 约束）
- 不修改任何现有表
- 可安全回滚（`op.drop_table` 即可）

### 后端部署

1. 部署新模型、schema、service、路由
2. 重启服务（无需数据迁移）
3. 既有 API 不受影响（路由前缀独立）

### 前端部署

1. 部署新组件（`RecordingSegmentCommentsPanel` 等）
2. 录像回放页渐进式启用（新组件默认开启，无需 feature flag）
3. 既有录像 API 客户端不变

### 回滚策略

- **数据库**：`alembic downgrade -1` 删除表（CASCADE 自动删除标注数据）
- **后端**：回滚部署，前端调用会 404 但不影响既有功能
- **前端**：回滚部署即可（既有录像回放页无标注时降级为原始 UI）

---

## Open Questions

1. **content 长度上限**：建议 ≤5000 字符；过长是否拆到 `comment_revision` 版本表？（倾向于：当前不限制长度，靠 DB TEXT 兜底；未来真有长文需求再做版本表）
2. **标注编辑历史**：当前不保留编辑轨迹（last-write-wins），是否需要追加？（倾向于：暂不需要，标注是轻量内容）
3. **跨 segment 标注**：当前强制单 segment；是否允许标注跨段？（倾向于：不支持，未来如需要扩展为 `segment_ids: BIGINT[]`）
4. **批量删除失败处理**：当前逐条跳过 + 返回 skipped 列表，是否改为"全部成功才提交"？（倾向于：当前策略更友好，保留）
5. **show_time 精度**：当前 `DECIMAL(10,3)` 毫秒级；rrweb 是否提供毫秒级时间戳？（已确认 rrweb 使用毫秒精度，前端需转换为相对秒数）
6. **creator 配色是否允许自定义**：当前按 creator_id 哈希到调色板，是否需要让用户自选颜色？（倾向于：不支持，保持简单）

## 参考

- 产品设计：`design/docs/product/workspaces/recording.md` 第 7.2-7.7 节
- 技术设计：`design/docs/technical/workspaces/recording-segment-comment.md`
- 关联 spec：`specs/recording-segment-comment/spec.md`
- 关联 proposal：`proposal.md`
