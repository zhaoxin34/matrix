## Context

knlg-base 是 Neo 平台"把专家隐性经验沉淀为 AI 可用决策记忆"的核心子系统。其技术设计文档（P0 阶段：数据库 schema、后端 API、前端模块拆分）已完成审查与一致性修正：

- 数据库表名统一为 `knlg_` 前缀
- API 路径消除 `/rules/rules/{id}` 重复
- 前端目录结构对齐现有约定 `(main)/workspace/[workspace_code]/...`
- Workspace 角色命名统一为 `Guest`（与 `WorkspaceMember.MemberRole.GUEST` 一致）

**当前状态**：

- 现有 17 个后端模块（agent / auth / workspace / recording 等）已稳定运行
- 现有前端 11 个路由组已稳定
- 现有 WorkspaceMember 角色（OWNER/ADMIN/MEMBER/GUEST）已实现
- 现有 agents/interceptors 模块的"workspace_code 路径 + Repository 分层"模式可直接复用

**约束**：

- P0 阶段不涉及 AI 调用（LLM Gateway / Prompt 管理 / 访谈 Agent 状态机属于 P1+ 后续变更）
- P0 阶段不引入 Celery 异步任务队列（同步 API 即可覆盖 CRUD 场景）
- P0 阶段不实现知识卡片的版本对比功能（`knlg_knowledge_card_version` 表创建但 P0 不使用）
- 必须严格遵循 Neo 平台已有的分层架构（api → service → repository → model）

**利益相关者**：

- 后端工程师：实现 API + DB 层
- 前端工程师：实现页面 + 表单
- 架构师：保证与现有平台一致性
- 产品经理：保证 P0 范围与产品设计对齐

## Goals / Non-Goals

**Goals（本次设计要达成）：**

1. **实现 P0 CRUD 范围**的 5 个子模块的端到端功能（知识卡片 / 问答库 / 规则库 / 知识导入 / 首页导航）
2. **保持架构一致性**：复用现有 agents / interceptors 模块的"workspace_code 路径 + Service/Repository 分层"模式
3. **保证数据隔离**：所有 knlg-base API 自动按 `workspace_id` 过滤，跨 workspace 不可访问
4. **保证权限控制**：基于 WorkspaceMember 角色（OWNER/ADMIN/MEMBER/GUEST）限制操作
5. **保证 API 契约一致性**：所有响应遵循 Neo 平台 `rules-api.md` 的 `{code, message, data, traceId, timestamp}` 结构
6. **保证可测试性**：service 层接受 db session 注入，方便单测
7. **保证可演进性**：model 层命名空间 `knlg_` 前缀预留，P1+ 功能可平滑扩展

**Non-Goals（明确不做）：**

- ❌ LLM 调用 / Prompt 管理 / AI 访谈 Agent 实时交互（P1+）
- ❌ 文档解析器 / PDF/Word 解析（P2）
- ❌ 规则触发引擎 / Event 订阅 / 规则验证回测（P3）
- ❌ Agent Memory 加载接口（P3）
- ❌ 知识卡片版本对比 UI（P1+）
- ❌ 候选知识审核流程（P1+）
- ❌ 全文检索（v1 阶段，列表页用 LIKE 模糊匹配）
- ❌ 软删除（用 `status` 字段管理生命周期：draft/active/deprecated/archived）
- ❌ 异步任务（不引入 Celery，同步 API + DB 事务即可）
- ❌ UI 原型（knlg-base 暂不创建高保真原型，路由表 UI 原型列填 `-`）

## Decisions

### D1: 后端模块按子模块拆分多个 router，而非单一 router

**选择**：在 `backend/src/app/api/v1/` 下创建 5 个 router（`knlg_base_qa.py` / `knlg_base_knowledge.py` / `knlg_base_rules.py` / `knlg_base_import.py` / `knlg_base_home.py`），统一前缀 `/api/v1/workspaces/{workspace_code}/knlg-base/<sub>/`

**理由**：

- 单文件 17 张表会达到 1500+ 行，难以维护
- 子模块 router 独立注册到 `main.py`，便于 P1+ 增量扩展（不影响其他子模块）
- 错误隔离：一个子模块出错不会影响其他子模块的 import

**备选方案**：

- **A**：单一 `knlg_base.py` router（1500+ 行）—— 简单但难维护
- **B**：每个 capability 独立前缀（`/qa` / `/knowledge` / `/rules`），子模块 router 内部分组 —— 采用 ✅

### D2: workspace_id 过滤采用"service 层显式传递"模式，而非 SQLAlchemy Event Hook

**选择**：每个 service 方法接受 `workspace_id: int` 参数，所有查询显式 `WHERE workspace_id = ?`，repository 层不做自动注入

**理由**：

- **可读性**：查询意图清晰可见，code review 时容易发现遗漏
- **可测性**：单测时可以传入任意 workspace_id，不需要 mock 全局上下文
- **避免隐式行为**：SQLAlchemy Event Hook 在跨模块查询时会引入隐式约束，调试困难
- **与现有模块一致**：现有 agents / interceptors 模块的 Service 都是显式传 workspace_id

**备选方案**：

- **A**：SQLAlchemy Event Hook 自动注入（数据库设计文档 §8.2 提到）—— 隐式行为，跨模块风险
- **B**：Middleware 注入到 request context，repository 层通过 context var 取 —— 增加间接性
- **C**：Service 层显式传 workspace_id —— 显式可控 ✅

### D3: workspace_code → workspace_id 转换在 service 层完成，router 层不感知

**选择**：API 路径用 `workspace_code`（URL 友好），service 层在入口调用 `get_workspace_by_code(db, code)` 转换为 `workspace_id`，后续全用 id

**理由**：

- 与现有 agents / interceptors 模块的 `_get_workspace_id()` 模式完全一致
- 业务逻辑全用 id 性能更好（FK 查询走索引）
- API 路径对用户友好（`/workspace/my-team/knlg-base/...` 比 `/workspace/3/knlg-base/...` 可读）

**备选方案**：

- **A**：API 路径直接用 `workspace_id` —— 不友好
- **B**：Dependency Injection 把 workspace_code → workspace_id 转换隐藏到 Depends 里 —— 增加间接性，复用性差

### D4: 软删除采用 status 字段，不用 deleted_at

**选择**：每个表用 `status` 字段管理生命周期（如 `knlg_question.status`、`knlg_knowledge_card.status`、`knlg_rule.status`），值含 `archived` / `deprecated`；删除 API 实际上是 UPDATE status

**理由**：

- 与产品理念一致（"问答库不能丢"—— 通过 status 标记而不是物理删除保留历史）
- 与现有 status / interceptor 模块的软删除模式一致
- 物理删除只用于明确的"误创建需要清除"场景（管理员操作，不暴露给普通 API）

**备选方案**：

- **A**：物理删除 —— 违反产品理念，问答库丢失无法恢复
- **B**：`deleted_at` 软删除字段 —— 与 status 二选一即可，不必两个都做

### D5: 前端使用 TanStack Query + Zustand 组合，遵循现有约定

**选择**：

- **服务端状态**：TanStack Query（useQuery / useMutation / 缓存 / 失效）
- **客户端状态**：Zustand（仅用于跨页面试访谈 session 草稿等瞬时状态）
- **表单**：React Hook Form + Zod
- **UI**：shadcn/ui + Tailwind 4

**理由**：

- 与现有 frontend 项目技术栈完全一致
- TanStack Query 的乐观更新机制适合 CRUD（点赞、引用等可乐观，发布/废弃保守）
- Zustand 比 Redux 轻量，适合中小型模块

**备选方案**：

- **A**：SWR（轻量但功能弱）—— 不够用
- **B**：纯 React Context —— 性能差，多页面状态同步不优雅
- **C**：TanStack Query + Zustand —— ✅

### D6: API 错误处理采用"自定义异常 + 全局 handler"模式

**选择**：Service 层抛出 `BusinessException(code, message)`，由 `core/exceptions.py` 的全局 handler 统一转换为 ApiResponse 格式

**理由**：

- 与现有 auth / interceptor 模块的 `BusinessException` 模式一致
- 业务错误码统一管理（`core/error_codes.py`）
- 避免每个 endpoint 重复写 try/except

**备选方案**：

- **A**：每个 endpoint 内 raise HTTPException —— 重复样板代码
- **B**：自定义异常 + 全局 handler —— ✅

### D7: 数据库迁移采用单一 Alembic revision

**选择**：本次变更创建 1 个 Alembic revision，包含 17 张表 + 索引 + 外键

**理由**：

- 17 张表都属于 knlg-base 模块，关系紧密，应该原子性部署
- 单次迁移便于回滚（一次 down 即可）
- 降低部署风险（不会因为中间状态导致服务异常）

**备选方案**：

- **A**：按子模块拆分多个 revision —— 增加部署复杂度
- **B**：单次 migration —— ✅

### D8: P0 范围不实现的功能统一返回 501 或前端禁用按钮

**选择**：P0 不实现的端点（如 `/versions`、`/evidences`、`/backtest`、`/health`、`/executions`）不在 router 中注册；前端对应按钮 disabled 并 hover 提示"该功能将在 P1+ 提供"

**理由**：

- 不暴露不可用的端点，避免用户困惑
- 前端按钮禁用比返回 501 体验更好

**备选方案**：

- **A**：保留 stub 端点返回 501 —— 增加 API 噪音
- **B**：前端禁用按钮 —— ✅

### D9: 全文检索 P0 阶段用 MySQL LIKE，P1+ 再评估

**选择**：P0 列表页的 `keyword` 参数用 `LIKE '%keyword%'` 模糊匹配（title / statement / text 字段），不做 FULLTEXT 索引

**理由**：

- P0 数据量小（< 10K 行/表），LIKE 性能足够
- MySQL FULLTEXT 对中文支持需要 ngram parser，运维复杂度高
- v1 阶段优先保证功能完整，P1+ 再根据实际数据量评估

**备选方案**：

- **A**：MySQL FULLTEXT with ngram —— 复杂
- **B**：引入 Elasticsearch —— 过度设计
- **C**：LIKE 模糊匹配 —— ✅（v1 阶段足够）

### D10: 知识导入 P0 只做"上传文件 + 创建导入任务"，不解析

**选择**：上传接口调用 RustFS 存储（沿用现有 storage 模块），创建 `knlg_import_job` 记录（status=pending），不触发解析。解析任务留给 P2 文档解析器

**理由**：

- 与产品设计文档一致（知识导入的"实际解析"在 P2）
- P0 阶段验证上传链路 + 任务记录流程即可

**备选方案**：

- **A**：上传后立即同步解析 —— 违反分阶段原则
- **B**：上传 + 异步解析（Celery）—— 引入不必要的复杂度
- **C**：上传 + 创建 pending 任务 —— ✅

## Risks / Trade-offs

- **[R1] 数据库 17 张表集中迁移风险** → **缓解**：在测试环境先迁移，验证所有 FK 约束 + 索引正确后再上生产；提供一次性 down 脚本
- **[R2] 前后端联调接口契约风险** → **缓解**：先完成 API schema（OpenAPI 自动生成），前端按 schema 生成 TS 类型，前后端各做一次 e2e（手测，不写自动化）
- **[R3] Workspace 角色权限未在所有现有模块强制** → **缓解**：knlg-base 显式实现角色校验（即使其他模块没做），未来其他模块跟进时已有参考
- **[R4] 17 张表的 Repository/Service 代码量较大** → **缓解**：先用统一的 BaseRepository 模板生成骨架，再填充具体业务逻辑；预计每个 repo 50-100 行，每个 service 100-200 行
- **[R5] 大量 Pydantic schema 字段** → **缓解**：用 `BaseSchema` + `ConfigDict(from_attributes=True)` 减少样板代码；列表响应复用 `ItemListResponse[T]` 泛型
- **[R6] 前端 18 个页面工作量较大** → **缓解**：列表/详情/编辑表单用通用模板（`useListPage` / `useEditForm` hooks），减少重复代码

## Migration Plan

### 部署步骤（按顺序）

1. **数据库迁移**：`cd backend && make migrate`（应用 Alembic revision）
2. **后端部署**：部署新的 backend 镜像，包含 knlg-base 模块
3. **前端部署**：部署新的 frontend 镜像，包含 knlg-base 路由
4. **冒烟测试**：登录 → 创建 workspace → 进入 `/workspace/{code}/knlg-base` → 验证 5 个子模块入口可见
5. **功能验证**：在 1 个 workspace 内完成知识卡片/问答/规则/导入的 CRUD 流程

### 回滚策略

- **数据库**：`make migrate-down-1` 回滚 Alembic revision（17 张表一次性回滚）
- **后端**：部署前一版本镜像（不含 knlg-base router）
- **前端**：部署前一版本镜像（不含 knlg-base 路由）

### 灰度策略

P0 阶段暂不做灰度（一次性发布到所有 workspace）；P1+ 引入"按 workspace 灰度"机制时再实现 feature flag。

## Open Questions

- **OQ1**：P0 阶段是否需要实现"按 workspace 隔离的 LLM Provider 配置"？还是 LLM 配置（`knlg_llm_provider` / `knlg_llm_model`）全局共享？
  - **倾向**：全局共享（P0 不实现 workspace 级覆盖），简化配置管理
- **OQ2**：知识卡片的"发布"操作是否需要审批流？当前文档只提到"Owner/Admin 可发布"，未提审批
  - **倾向**：P0 不做审批流，`status` 直接从 `draft` → `published`，P1+ 再加审核环节
- **OQ3**：`knlg_interview_turn` 表的 `metadata` JSON 字段在 P0 是否需要预定义 schema（如 `signals` / `counter_example_marks`）？
  - **倾向**：P0 不约束 schema，自由 JSON；P1+ 访谈 Agent 接入时再规范化
- **OQ4**：前端"知识库首页"P0 阶段除了导航入口，是否需要展示"最近 7 天创建的卡片数"等简单统计？
  - **倾向**：P0 只展示导航入口（4 个卡片：问答库 / 知识库 / 规则库 / 知识导入）；统计推到 P1
