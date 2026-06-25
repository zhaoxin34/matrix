## Context

事件（Event）和状态（Status）是 Neo 平台知识库的基础数据模型：

- **Event**: 记录"谁在什么时间做了什么"，由 sati 等系统自动生成，也支持用户手动管理
- **Status**: 实体的属性快照，通过 `entity_name` 和 `captured_at` 与事件关联

当前系统缺乏统一的事件和状态管理能力，需要开发完整的 CRUD 接口和前端页面。

**技术约束**：

- 后端使用 Python FastAPI
- 前端使用 Next.js + React + TypeScript
- 数据库使用 MySQL
- API 遵循 `.pi/rules/rules-api.md` 规范
- 数据删除采用硬删除策略

**相关文档**：

- 产品设计：`design/docs/product/workspaces/events.md`、`design/docs/product/workspaces/status.md`
- 技术设计：`design/docs/technical/workspaces/events.md`、`design/docs/technical/workspaces/status.md`

## Goals / Non-Goals

**Goals:**

- 实现 Event 和 Status 的完整 CRUD API
- 实现 Event 和 Status 的前端管理页面（列表、详情、创建、编辑）
- 支持按名称、实体、触发者、时间范围等条件筛选
- 数据采用硬删除策略，不保留历史

**Non-Goals:**

- 不实现事件的状态机/工作流（Events 作为基础日志数据）
- 不实现批量操作（创建、删除）
- 不实现软删除和回收站功能
- 不实现事件自动采集（由 sati 系统负责）

## Decisions

### Decision 1: 数据表设计

**选择**：分别为 Event 和 Status 创建独立的数据库表

**理由**：

- Event 和 Status 是不同性质的数据，Event 是行为记录，Status 是属性快照
- 独立表设计便于各自独立演进和维护
- 通过 `entity_name` 字段实现逻辑关联

**替代方案考虑**：

- 使用 JSONB 存储在单一表：通过 `type` 字段区分。缺点是不利于索引和查询，已否决

### Decision 2: 唯一约束策略

**Event**：

- 无唯一约束，因为同一动作可能被多次触发（如页面刷新）

**Status**：

- `entity_name + captured_at` 作为唯一约束
- 理由：同一实体在同一时间点只能有一个状态快照

### Decision 3: API 路径设计

**选择**：`/api/v1/workspaces/{workspace_code}/events` 和 `/api/v1/workspaces/{workspace_code}/status`

**理由**：

- 符合 RESTful 规范，资源嵌套在 workspace 下
- 与现有 embedded-site 等功能保持一致
- workspace_code 作为路径参数便于权限校验

### Decision 4: 删除策略

**选择**：硬删除（物理删除）

**理由**：

- Events 和 Status 作为日志类数据，数据量大时软删除会造成空间浪费
- 与系统自动采集的数据性质不同，用户手动创建的数据不需要保留历史
- sati 系统会有自己的备份策略

### Decision 5: 创建人字段

**选择**：所有记录都需要 `created_by` 字段

**理由**：

- 便于审计追踪
- 与 sati 系统生成的数据区分（sati 创建的记录 created_by 可以是系统用户）
- 支持按创建人筛选

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 数据量大影响查询性能 | 通过合理的索引设计（workspace_id, timestamp, entity_name, actor 等） |
| 硬删除导致误删无法恢复 | 前端增加二次确认对话框；建议用户在删除前确认重要性 |
| entity_name 格式不规范 | API 层进行格式校验（正则：`^[a-z0-9_]+_[a-zA-Z0-9_]+$`） |
| attributes JSON 字段无 Schema | 前端使用 JSON Editor 进行可视化编辑；后端只做格式校验 |

## Migration Plan

### Phase 1: 数据库迁移

1. 创建 `event` 表
2. 创建 `status` 表
3. 添加必要的索引

### Phase 2: 后端 API

1. 实现 Event CRUD API
2. 实现 Status CRUD API
3. 添加单元测试

### Phase 3: 前端开发

1. 实现 Event 列表页
2. 实现 Event 详情/创建/编辑页
3. 实现 Status 列表页
4. 实现 Status 详情/创建/编辑页

### Phase 4: 路由注册

1. 确认 routing-table.md 中的路由配置
2. 更新前端路由配置

### Rollback Strategy

- Phase 1/2 回滚：执行 DROP TABLE（或使用版本化表名）
- Phase 3/4 回滚：删除前端页面代码

## Open Questions

1. **sati 系统如何调用 Event API？** 需要确认 sati 是否会直接调用本系统 API，还是通过消息队列
2. **是否需要支持 Event 的批量创建？** 目前设计只支持单条创建
3. **Status 的 attributes 是否需要 JSON Schema 验证？** 当前只做格式校验
4. **是否需要支持导出功能？** 目前不在范围内
