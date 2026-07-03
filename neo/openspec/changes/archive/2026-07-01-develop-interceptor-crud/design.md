## Context

拦截器(Interceptor)是配置在特定网站(EmbeddedSite)上的规则，定义：

- **什么时候**触发（DOM 点击 / 网络请求）
- **捕获什么**（操作主体、目标）
- **触发什么 action**（生成 Event、采集 Status、弹确认等）

本期仅实现拦截器的 CRUD 管理功能 + API 暴露。Extension 执行、Action Player 等在后续阶段实现。

### 现状

- 产品文档：已完成
- 技术文档：已完成（数据模型、API 设计、状态机）
- 路由表：已注册
- API 路径：已统一

### 参考实现

参考 `embedded-sites` 和 `events`/`status` 的实现模式，保持一致。

## Goals / Non-Goals

**Goals:**

- 实现 Interceptor 的完整 CRUD（创建、列表、详情、更新、删除）
- 实现启用/禁用功能
- API 供 Extension 查询
- 软删除策略（改为 DISABLED 状态）

**Non-Goals:**

- Extension 执行逻辑
- Action Player
- 拦截器触发历史（可观测性）
- trigger JSON 编辑器 form 化

## Decisions

### Decision 1: 软删除策略

**选择**：DELETE 操作改为 `status = DISABLED`

**理由**：

- 保留历史记录用于审计
- 支持"禁用"功能复用删除操作
- 与 events/status 的硬删除策略不同（interceptor 有启用/禁用需求）

### Decision 2: 状态字段设计

**选择**：`status` 使用 `ENABLED` / `DISABLED` 枚举值

**理由**：

- 语义清晰，与其他功能的状态命名一致
- API 查询时支持 `status=ENABLED` 过滤

### Decision 3: embedded_site_id 必填

**选择**：每个 interceptor 必须关联到一个 EmbeddedSite

**理由**：

- 拦截器离开 site 没有意义
- Extension 加载时通过 site 匹配拦截器
- 简化业务逻辑

### Decision 4: trigger_type 自动同步

**选择**：写入/更新 trigger 时，自动从 `trigger.type` 提取并同步 `trigger_type` 字段

**理由**：

- 便于按类型查询（DOM vs Network）
- service 层处理，对 API 调用方透明
- 避免数据不一致

## Risks / Trade-offs

| 风险 | 描述 | 缓解措施 |
|------|------|----------|
| trigger JSON 格式错误 | 用户可能输入格式错误的 trigger JSON | 后端校验 trigger 格式，返回明确错误信息 |
| 大量 interceptor 影响性能 | Extension 加载时可能拉取很多拦截器 | 分页查询 + 仅加载 ENABLED 状态 |
| site 删除后 interceptor 孤立 | 如果 site 被删除，关联的 interceptor 怎么处理 | 本期不做处理，后续可加外键约束 |

## Open Questions

1. **site 删除时 interceptor 处理**：是否需要级联删除或阻止删除？
   - 建议：本期允许删除 site，interceptor 的 embedded_site_id 变为 NULL

2. **trigger JSON 编辑器**：本期直接编辑 JSON，后续是否需要 form 化？
   - 建议：本期保持 JSON 编辑，降低复杂度
