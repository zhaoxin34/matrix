# Tasks: recording-segment-comment

## 1. 数据层

- [x] 1.1 在 `backend/src/app/models/recording_segment_comment.py` 创建 SQLAlchemy 模型，含 11 字段 + 4 索引命名 + 2 CHECK 约束 + 3 FK
- [x] 1.2 在 `backend/src/app/models/__init__.py` 注册新模型，确保 metadata 可被发现
- [x] 1.3 创建 Pydantic schemas 于 `backend/src/app/schemas/recording_segment_comment.py`（Create/Update/Response/List 4 类）
- [x] 1.4 创建 Alembic 迁移脚本 `backend/alembic/versions/<date>_create_recording_segment_comment_table.py`
- [x] 1.5 应用迁移至本地 dev DB：`cd backend && alembic upgrade head`，验证 `DESCRIBE recording_segment_comment` 表结构
- [x] 1.6 验证级联删除：临时删除一个测试 recording，确认 segment 与 comment 一同被删除

## 2. 服务层

- [x] 2.1 创建 `backend/src/app/services/recording_segment_comment_service.py`，封装 CRUD + 批量删除 + 权限校验
- [x] 2.2 实现 `create_comment` 服务方法（含时区范围校验、workspace 权限校验）
- [x] 2.3 实现 `update_comment` 服务方法（creator / Owner 校验）
- [x] 2.4 实现 `delete_comment` 与 `batch_delete_comments` 服务方法（逐条 creator 校验，失败收集到 skipped 列表）
- [x] 2.5 实现 `list_by_recording` 与 `list_by_segment` 服务方法（分页与排序）
- [x] 2.6 添加单元测试：权限矩阵（Member/Guest 不能写、Admin 只能改自己、Owner 全权）
- [x] 2.7 添加单元测试：hide_time <= show_time 拒绝；show_time < 0 拒绝
- [x] 2.8 添加单元测试：批量删除逐条校验，skipped 列表正确

## 3. API 层

- [x] 3.1 创建路由文件 `backend/src/app/api/v1/recording_segment_comments.py`
- [x] 3.2 实现 6 个端点：POST 创建、GET 按 recording 列表、GET 按 segment 列表、PUT 更新、DELETE 删除、DELETE 批量
- [x] 3.3 在 `backend/src/app/api/v1/__init__.py` 注册新路由
- [x] 3.4 在错误码常量中补充 1003 (Forbidden)、2010 (Comment Not Found)、2011 (Invalid Time Range)、2012 (Abstract Too Long)
- [x] 3.5 启动后端服务并用 curl/Postman 验证 6 个端点的 request/response schema
- [x] 3.6 集成测试：完整流程（创建 → 列表 → 跳转 → 更新 → 删除）

## 4. 前端基础设施

- [x] 4.1 在 `frontend/lib/api/recording-comment.ts` 新增 API 封装（listByRecording / listBySegment / create / update / delete / batchDelete）
- [x] 4.2 在 `frontend/lib/recording/types.ts` 新增 `SegmentComment` 类型与 comments 子树
- [x] 4.3 在 store 新增 `comments` 状态树（bySegment / activeIds / highlightedId / dialog）
- [x] 4.4 实现 `comments` actions：loadSegmentComments / upsertComment / removeComment / setActiveIds
- [x] 4.5 实现 creator→color 哈希工具函数（确定性 8 色调色板）

## 5. 前端 UI 组件

- [x] 5.1 创建 `RecordingCommentDialog` 组件（新建/编辑模式、摘要/详情、时间区间调整、保存后跳转）
- [x] 5.2 创建 `RecordingSegmentCommentsPanel` 组件（叠放面板、列表项、▶ 跳转 / ✏️ / 🗑 操作）
- [x] 5.3 创建 `RecordingCommentCanvasOverlay` 组件（rrweb 画布气泡堆叠、N/M 切换器、详情展开）
- [x] 5.4 创建 `RecordingCommentTimelineMarkers` 组件（SVG 进度条色块、绝对定位、pointer-events: none）
- [x] 5.5 组件单元测试：comment-color 纯函数验证 (5/5 PASSED)

## 6. 前端集成

- [x] 6.1 录像回放页加载当前录像所有标注（listByRecording）
- [x] 6.2 改造 Segment 卡片：折叠/展开状态、`[N]` 角标、点击展开后嵌入 comments 面板
- [x] 6.3 播放器控制条新增 `[+ 标注]` 按钮，点击暂停 + 打开 dialog
- [x] 6.4 侧栏底部新增 `[+ 标注]` 冗余入口（默认归属当前展开 segment）
- [x] 6.5 实现 currentTime 监听（节流至 10fps）+ activeIds 计算 + Segment 切换时重算
- [x] 6.6 实现 ▶ 跳转定位（seekTo show_time + autoPlay）
- [x] 6.7 实现 hover 侧栏列表项 → 画布气泡高亮（双向联动）
- [x] 6.8 实现 edit/delete 操作（含二次确认弹窗、creator 权限显示）

## 7. 端到端验证

- [ ] 7.1 e2e（手测或 playwright）：创建标注 → 播放到时段 → 画布气泡 + 列表高亮 → 跳转 → 编辑 → 删除
- [ ] 7.2 e2e：Viewer 登录后查看列表 OK，但 [+ 标注] 按钮隐藏 / 点击 403
- [ ] 7.3 e2e：Editor 看不到他人标注的 [编辑/删除] 按钮
- [ ] 7.4 e2e：跨 segment 切换，标注 active 状态正确重算（时间偏移 = segmentElapsed）
- [ ] 7.5 e2e：进度条色块按 creator 着色，切换 segment 时色块正确替换
- [ ] 7.6 性能验证：100 条标注 + 5 分钟录像，播放期间 FPS ≥ 50（DevTools Performance 面板）
- [ ] 7.7 回归验证：现有录像回放功能（无标注数据时降级为原始 UI）不受影响

## 8. 文档同步与归档

- [ ] 8.1 比对实现与 `design/docs/technical/workspaces/recording-segment-comment.md`，如有偏差回写更新
- [ ] 8.2 在前端 README 中追加标注组件使用示例（如有）
- [ ] 8.3 归档 change：`openspec archive recording-segment-comment --yes`
- [ ] 8.4 归档后追加 requirement 到 `openspec/specs/recording-playback/spec.md`（联动展示标注相关 Requirement）
