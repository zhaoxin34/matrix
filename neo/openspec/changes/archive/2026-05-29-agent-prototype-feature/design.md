## Context

### 背景

Agent Prototype 是 Neo 平台的 Agent 核心基础设施，提供了 Prompts 配置和版本化管理能力。管理员需要通过管理后台来创建、编辑和发布 Prototype，同时需要支持版本历史查看和回滚功能。

### 现状

- 已有 `agent_prototype` 和 `agent_prototype_version` 数据模型设计
- 已有状态机定义（draft → enabled ↔ disabled）
- 需要开发管理后台 UI 和 REST API

### 约束

- 仅管理员可访问 Prototype 管理功能
- Prototype 发布需要变更说明，必填
- 版本号自动递增，不可手动指定
- 仅 draft 状态可删除
- 回滚是复制操作，不删除历史版本

## Goals / Non-Goals

**Goals:**
- 提供完整的 Agent Prototype 管理界面（列表、详情、编辑）
- 实现 CRUD 操作（创建、读取、更新、删除）
- 实现版本发布和回滚功能
- 支持状态管理（禁用/启用）
- 管理员权限控制

**Non-Goals:**
- 不包含 Agent Factory 功能的实现
- 不包含 Agent 调度和任务执行
- 不包含 UI 原型设计（UI 页面在 openspec 外单独维护）

## Decisions

### 1. API 路由设计

**决策**: RESTful API 风格，使用 `/api/v1/agent_prototype` 前缀

**理由**:
- 与 Neo 平台其他 API 保持一致
- 资源层级清晰，易于理解和扩展
- 支持标准 HTTP 方法

**API 设计**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/agent_prototype` | 列表（支持分页、筛选、搜索） |
| POST | `/api/v1/agent_prototype` | 创建 |
| GET | `/api/v1/agent_prototype/{id}` | 详情 |
| PUT | `/api/v1/agent_prototype/{id}` | 更新 |
| DELETE | `/api/v1/agent_prototype/{id}` | 删除（仅 draft） |
| POST | `/api/v1/agent_prototype/{id}/publish` | 发布 |
| GET | `/api/v1/agent_prototype/{id}/versions` | 版本历史 |
| POST | `/api/v1/agent_prototype/{id}/rollback` | 回滚 |
| PUT | `/api/v1/agent_prototype/{id}/status` | 修改状态（禁用/启用） |

### 2. 数据模型

**决策**: 复用 `agent-database-design.md` 中定义的数据模型

**表结构**:
- `agent_prototype`: 主表（id, code, name, description, version, model, prompts, status, created_by, created_at, updated_at）
- `agent_prototype_version`: 版本表（id, agent_prototype_id, version, prompts_snapshot, config_snapshot, change_summary, created_by, created_at）

**理由**:
- 保持数据模型一致性
- 与 Agent Factory 共享底层数据结构

### 3. 版本号策略

**决策**: 使用语义化版本号，格式为 `major.minor.patch`（如 `1.0.0`）

**递增规则**:
- 首次发布: `1.0.0`
- 后续每次发布: patch 位递增（如 `1.0.0` → `1.0.1`）
- major/minor 由系统固定为 `1.0`

**理由**:
- 简化版本管理
- 避免手动指定导致的版本冲突
- 保持版本历史可追溯

### 4. 状态转换

**决策**: 使用有限状态机控制状态转换

**转换规则**:
```
draft → enabled: 发布
enabled → disabled: 禁用
disabled → enabled: 启用
draft → [deleted]: 删除（仅 draft）
disabled → [deleted]: 软删除
```

**验证逻辑**:
- 删除前检查状态必须为 draft
- 禁用/启用前检查 Prototype 必须已发布（有 version）
- 发布前检查 prompts 内容非空

### 5. 回滚实现

**决策**: 回滚是复制操作，源版本数据不变

**流程**:
1. 从 `agent_prototype_version` 读取目标版本的 `prompts_snapshot` 和 `config_snapshot`
2. 更新 `agent_prototype` 的 prompts 和 config 字段
3. 更新 version 字段为回滚的版本号
4. 创建新的版本记录（标记为回滚操作）

**理由**:
- 不破坏历史版本数据
- 回滚操作可追溯
- 支持多次回滚

## Risks / Trade-offs

[Risk] 版本历史数据膨胀
→ **Mitigation**: 定期归档或限制历史保留数量（如保留最近 50 个版本）

[Risk] Prompts 内容过长导致存储问题
→ **Mitigation**: 使用 TEXT 类型（最大 65535 字节），前端限制输入长度

[Risk] 多人同时编辑冲突
→ **Mitigation**: 使用乐观锁（version 字段），冲突时提示用户刷新后重试

[Risk] 删除误操作导致 Prototype 不可恢复
→ **Mitigation**: 仅允许删除 draft 状态，已发布的 Prototype 不可删除

## Migration Plan

### 部署步骤

1. **数据库迁移**
   - 创建 `agent_prototype` 表
   - 创建 `agent_prototype_version` 表
   - 创建索引

2. **后端 API 部署**
   - 部署 `/api/v1/agent_prototype` 相关接口
   - 验证接口功能

3. **前端页面部署**
   - 部署 `/admin/agent-prototype/*` 页面
   - 验证页面功能

### 回滚策略

- 数据库: 使用事务，回滚失败时自动回退
- API: 保留旧版本接口，平滑切换
- 前端: 使用历史部署记录快速回滚

## Open Questions

1. **UI 原型**: 尚未完成，需要确认 UI 设计进度
2. **权限配置**: 管理员角色定义需要确认（超级管理员 vs 普通管理员）
3. **版本清理**: 历史版本是否需要自动归档策略？
4. **Prompts 验证**: 是否需要定义 Prompts JSON Schema 验证？