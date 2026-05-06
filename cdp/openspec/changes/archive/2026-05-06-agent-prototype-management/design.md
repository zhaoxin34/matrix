## Context

Agent 原型管理是 CDP 平台的一个基础功能模块，用于：

1. **定义 Agent 模板**：通过 soul、memory、reasoning、agents、workflow、communication 等提示词配置，定义 Agent 的认知和行为模式
2. **版本控制**：支持对原型进行版本管理，确保变更可追溯
3. **快照历史**：每次发布形成完整快照，支持历史回溯

**当前状态**：无相关功能
**约束**：使用现有的 User 表（user_id 为 int）、MySQL 数据库、FastAPI + SQLAlchemy 架构

## Goals / Non-Goals

**Goals:**
- 提供 Agent 原型的 CRUD API
- 支持原型版本发布与历史回溯
- prompts 字段直接存储所有提示词内容（JSON 格式）

**Non-Goals:**
- 不实现具体的 Agent 执行逻辑（那是运行时的事）
- 不实现 Agent 实例管理（实例化后的管理）
- 不包含 tools 配置（tools 与 workspace 耦合）
- 不实现权限控制（复用现有 User 体系）
- 不单独管理 prompt 版本（prompts 跟随原型版本）

## Decisions

### 表结构设计

**Decision 1: 使用 BIGINT 自增主键**

所有表使用 BIGINT 自增主键，替代 UUID。

**Rationale**: 更简洁的 API URL、更易调试、MySQL 索引性能更好。

**Decision 2: prompts 字段直接存储**

原型表直接用 `prompts: JSON` 字段存储所有提示词内容，不再单独关联 prompt 表。

```json
{
  "soul": "...markdown content...",
  "memory": "...markdown content...",
  "reasoning": "...markdown content...",
  "agents": "...markdown content...",
  "workflow": "...markdown content...",
  "communication": "...markdown content..."
}
```

**Rationale**: prompts 和原型版本天然一致，无需单独维护映射关系，简化设计。

### 3.1 agent_prototypes

```sql
CREATE TABLE agent_prototypes (
    id                BIGINT PRIMARY KEY AUTO_INCREMENT,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    version           VARCHAR(50) NOT NULL DEFAULT '1.0.0',  -- 原型自身版本

    -- 运行时配置
    model             VARCHAR(100) NOT NULL,
    temperature       FLOAT DEFAULT 0.7,
    max_tokens        INT DEFAULT 4096,

    -- Prompts（JSON，直接存储所有提示词）
    prompts           JSON NOT NULL DEFAULT '{}',

    -- 状态：draft/enabled/disabled
    status            VARCHAR(20) DEFAULT 'draft',

    -- 审计字段
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by        INT NOT NULL REFERENCES users(id),
    updated_by        INT REFERENCES users(id)
);
```

### 3.2 agent_prototype_versions

```sql
CREATE TABLE agent_prototype_versions (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    prototype_id    BIGINT NOT NULL REFERENCES agent_prototypes(id) ON DELETE CASCADE,

    version         VARCHAR(50) NOT NULL,  -- e.g., "1.0.0", "1.1.0"

    -- 发布时的快照（JSON）
    prompts_snapshot JSON NOT NULL,  -- 发布时的完整 prompts
    config_snapshot JSON NOT NULL,  -- {model, temperature, max_tokens, status}

    -- 变更说明
    change_summary  TEXT,

    -- 审计
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      INT NOT NULL REFERENCES users(id),

    UNIQUE INDEX idx_version_prototype (prototype_id, version)
);
```

### AgentPromptType 枚举

```python
class AgentPromptType(str, Enum):
    # Layer 1: Cognition - 解决"怎么思考"
    SOUL = "soul"          # 核心灵魂：定义 Agent 的基本性格、价值观和行为准则
    MEMORY = "memory"      # 记忆机制：定义 Agent 如何存储和检索过往经验
    REASONING = "reasoning"  # 推理方式：定义 Agent 的思考链和问题解决模式

    # Layer 2: Organization - 解决"怎么协作"
    AGENTS = "agents"      # 多智能体：定义多 Agent 协作时的角色分工
    WORKFLOW = "workflow"   # 工作流程：定义任务执行的标准流程和步骤
    COMMUNICATION = "communication"  # 沟通方式：定义 Agent 与用户/其他 Agent 交互规范
```

### API 路由设计

```
/api/v1/agent-prototypes
├── GET    /                         # 列表
├── POST   /                         # 创建
├── GET    /{id}                     # 详情
├── PUT    /{id}                     # 更新（包含 prompts）
├── DELETE /{id}                      # 删除（仅 draft）
├── POST   /{id}/publish             # 发布新版本
├── GET    /{id}/versions             # 版本历史
└── POST   /{id}/rollback            # 回滚到指定版本
```

### 版本发布流程

```
1. 编辑 Prototype 配置和 Prompts
2. 调用 POST /{id}/publish
3. 系统生成新 version（如 1.1.0）
4. 创建 agent_prototype_versions 快照记录
5. 更新原型状态为 enabled
```

### 回滚流程

```
1. 调用 POST /{id}/rollback，指定目标 version
2. 从 agent_prototype_versions 读取快照
3. 恢复 prompts 和 config_snapshot 到 agent_prototypes
4. 记录回滚操作到历史（作为新版本）
```

### 状态流转

```
draft → enabled ↔ disabled
```

| 状态 | 说明 |
|------|------|
| draft | 初始状态，未发布 |
| enabled | 已发布，至少有一个版本 |
| disabled | 已禁用 |

**触发规则**：
- 创建时：`draft`
- 发布后：`enabled`
- `enabled` ↔ `disabled`：可以互相切换

## Risks / Trade-offs

**[Risk] prompts 内容过长**
→ Mitigation: 使用 TEXT 类型存储，MySQL 可存储最多 65535 字节；对于超长内容可考虑压缩存储

**[Risk] prompts 结构无数据库级验证**
→ Mitigation: 在应用层校验 JSON 结构，确保包含所有必需 type

## Open Questions

无

## Deleted

- 移除 `agent_prototype_prompts` 表：prompts 直接存储在原型表中
- 移除 `prompt_selections` 字段：prompts 跟随原型版本，无需单独映射
