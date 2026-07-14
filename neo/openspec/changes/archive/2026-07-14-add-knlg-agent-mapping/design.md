## Context

当前项目已有 Agent Prototype（带 type 字段）、Agent 实例、Workspace 三层结构，但缺少 `(workspace, type) → agent` 的映射表。访谈 Agent 等下游消费者无法知道"某个 type 应该用哪个 Agent 实例"。

**当前状态：**

- `agent_prototype.type` 字段已存在（`EXPERT_INTERVIEW` / `SITE_OPERATION`），作为 prototype 的设计意图标记
- `agent_prototype_repository` 支持按 `type` 过滤，但仅返回 prototype，不是实例
- `embedded_sites.py` 已经建立了 `/workspaces/{workspace_code}/...` 嵌套 router 的范式

**约束：**

- MySQL 数据库（`neo`）
- FastAPI + SQLAlchemy 2.x 异步同步混合风格
- 必须 alembic migration
- 需通过现有 `get_current_user` 鉴权

**利益相关方：**

- ai-interview-agent（消费方，查询 `expert_interview` 对应的 Agent）
- 前端 Agent 配置页（CRUD 映射）
- 后端维护者

## Goals / Non-Goals

**Goals:**

- 提供 `(workspace_id, type) → agent_id` 的 CRUD 能力
- 保证 `(workspace_id, type)` 唯一性（业务约束）
- 一次性满足 M1（CRUD）+ M2（查询优化）的 schema 设计
- API 风格与 `embedded_sites.py` 保持一致

**Non-Goals:**

- 不做 Agent 类型推断 / 自动推荐
- 不实现 `agent_prototype.type` 的修改（已由其他改动支持）
- 不实现跨 workspace 共享映射（每个 workspace 独立维护）
- 不实现审计日志 / 操作历史
- 不实现批量操作

## Decisions

### 决策 1：表名用 `knlg_agent_mapping`

**选择：** `knlg_agent_mapping`（沿用 handoff 命名）

**理由：**

- handoff 已经定名，遵循既有决策
- `knlg_` 前缀与 `knlg_candidate_kc`、`knlg_knowledge_card` 等业务知识库表保持一致
- 表语义清楚（knowledge + agent + mapping）

**考虑的替代方案：**

- `agent_type_mapping`：太通用，跟 `agent_prototype` 命名空间混在一起
- `workspace_agent_mapping`：太具体，不便于后续扩展

### 决策 2：主键用 INT AUTO_INCREMENT

**选择：** `id INT PRIMARY KEY AUTO_INCREMENT`

**理由：**

- 跟 handoff 设计一致
- 业务主键是 `(workspace_id, type)`，但仍需独立主键便于关联/调试
- 大多数业务表都是 INT，BigInteger 在此表不需要

**考虑的替代方案：**

- 用 `(workspace_id, type)` 作复合主键：无法用 INT 自增 ID 引用，FK 关联复杂
- 用 `UUID`：项目里其他表都用 INT，风格不一致

### 决策 3：UNIQUE 约束 + 显式索引

**选择：**

```sql
UNIQUE KEY uk_workspace_type (workspace_id, type)
INDEX idx_workspace_id (workspace_id)
```

**理由：**

- `UNIQUE` 既保证业务唯一性，又自带索引能力（M2 要求）
- 单独的 `idx_workspace_id` 用于按 workspace 列表查询（不需要 type 时）
- 一次性满足 M1 + M2，避免后续再加 migration

**考虑的替代方案：**

- 只用 UNIQUE：不支持 `WHERE workspace_id = ?` 不带 type 的查询（全表扫描）
- 用组合索引 `(workspace_id, type)` 当作普通索引（不 UNIQUE）：需要单独再加业务层去重逻辑

### 决策 4：type 用 VARCHAR(32) 而非 ENUM

**选择：** `type VARCHAR(32) NOT NULL`

**理由：**

- handoff 明确说 `type VARCHAR(32)`
- 与 `agent_prototype.type`（PyEnum → ENUM）不同，因为映射的 type 是更开放的业务概念，未来可能扩展
- VARCHAR(32) 足够容纳 `expert_interview`、`sales_assistant` 等命名

**考虑的替代方案：**

- ENUM 强约束：限制了未来扩展，且 handoff 没要求
- VARCHAR(64)：预留太多，浪费存储

### 决策 5：API 路径用 `/workspaces/{workspace_code}/agent-mappings`

**选择：** 沿用 `embedded_sites.py` 的范式

**理由：**

- 与现有 `/workspaces/{workspace_code}/embedded-sites`、`/workspaces/{workspace_code}/tasks` 风格一致
- `workspace_code` 是 URL 友好的字符串标识，比 int ID 更稳定
- 用户友好（前端可读性更好）

**考虑的替代方案：**

- 顶层 `/agent-mappings` 需要显式传 workspace_id：丢失了 workspace 上下文，违反 REST 嵌套资源风格

### 决策 6：service 层做权限/校验，repo 层只做 DB

**选择：**

- Service: workspace 存在性、agent 存在性、agent 属于该 workspace、type 长度校验
- Repository: 纯 CRUD，无业务规则

**理由：**

- 跟 `workspace_service`、`agent_prototype_service` 现有分层一致
- 便于未来加缓存 / 事件 / 重试逻辑

**考虑的替代方案：**

- 全在 Repository：业务逻辑泄露到数据层，难测试
- 全在 API：失去 service 抽象层，无法复用

### 决策 7：失败 agent_id 返回 404 而非 400

**选择：** POST/PUT 时若 `agent_id` 不存在或属于其他 workspace → 404

**理由：**

- 与 workspace 查找失败保持一致风格（都是 404）
- 防止泄露"该 ID 是否存在其他 workspace"的信息

### 决策 8：不实现 `GET /agent-mappings?type=xxx` 这种过滤

**选择：** 列表端点只按 workspace 列全部，详情端点按 type 取单个

**理由：**

- 通常一个 workspace 内的 mapping 数量很少（< 20）
- 前端通常需要"展示所有"，所以列表就是全集
- 若未来需要过滤再加 query param（向后兼容）

## Risks / Trade-offs

**[Risk] Agent 被删除后 mapping 仍是悬空引用** → 不在本次实现级联处理，文档说明："删除 Agent 应先删除其 mapping，否则 GET 时返回 404 但 mapping 记录仍在"。可以在 DELETE agent 接口里加联动检查（不属于本次范围，留 TODO）。

**[Risk] type 字段无 enum 约束，前端拼写错误无法在 DB 层捕获** → Service 层校验：长度 1-32，匹配 `^[a-z][a-z0-9_]*$`。返回 400。

**[Risk] 跨 workspace 的 agent 被映射到本 workspace** → Service 层校验：`agent.workspace_id == mapping.workspace_id`，否则 404。

**[Risk] 并发 POST 同一 (workspace_id, type) 导致重复** → DB UNIQUE 约束兜底，捕获 IntegrityError 转为 409。

**[Risk] delete 时 mapping 不存在** → 返回 404（不返回 204，避免调用方不知道是否成功）。

## Migration Plan

1. **升级：** alembic upgrade head（应用 `2026_07_14_003_add_knlg_agent_mapping.py`）
   - 建表 + 索引 + UNIQUE 约束一次性完成
2. **回滚：** alembic downgrade -1
   - 删表（无业务数据依赖，可直接 DROP）
3. **数据迁移：** 无需（旧表，不存在历史数据）
4. **兼容性：** 新增表 + 新增 endpoint，不影响任何现有功能

## Open Questions

（无。所有决策点已经在 handoff 中明确或经过上面分析确定。）
