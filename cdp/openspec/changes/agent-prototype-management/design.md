## Context

Agent 原型管理是 CDP 平台的一个基础功能模块，用于：

1. **定义 Agent 模板**：通过 soul、memory、reasoning、agents、workflow、communication 等提示词配置，定义 Agent 的认知和行为模式
2. **版本控制**：支持对原型和提示词进行版本管理，确保变更可追溯
3. **快照历史**：每次发布形成完整快照，支持历史回溯

**当前状态**：无相关功能
**约束**：使用现有的 User 表（user_id 为 int）、MySQL 数据库、FastAPI + SQLAlchemy 架构

## Goals / Non-Goals

**Goals:**
- 提供 Agent 原型的 CRUD API
- 支持提示词的版本化管理
- 支持原型版本发布与历史回溯
- 提示词支持 Layer 1（soul/memory/reasoning）和 Layer 2（agents/workflow/communication）分类

**Non-Goals:**
- 不实现具体的 Agent 执行逻辑（那是运行时的事）
- 不实现 Agent 实例管理（实例化后的管理）
- 不包含 tools 配置（tools 与 workspace 耦合）
- 不实现权限控制（复用现有 User 体系）

## Decisions

### 表结构设计

**Decision 1: 使用 JSON 存储 prompt_selections**

每个原型用 `prompt_selections: JSON` 字段记录每个 type 对应的 prompt 版本。

```json
{"soul": "1.0.0", "memory": "1.0.0", "reasoning": "1.1.0", "agents": "1.0.0", "workflow": "1.0.0", "communication": "1.0.0"}
```

**Rationale**: 相比关联表方案，单字段更简洁；相比固定字段，JSON 更灵活，支持 type 扩展。

### 3.1 agent_prototypes

```sql
CREATE TABLE agent_prototypes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    version           VARCHAR(50) NOT NULL DEFAULT '1.0.0',  -- 原型自身版本

    -- 运行时配置
    model             VARCHAR(100) NOT NULL,
    temperature       FLOAT DEFAULT 0.7,
    max_tokens        INT DEFAULT 4096,

    -- Prompt 版本选择（JSON）
    prompt_selections JSON NOT NULL DEFAULT '{}',

    -- 状态
    status            VARCHAR(20) DEFAULT 'draft',  -- draft | published | archived

    -- 审计字段
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by        INT NOT NULL REFERENCES users(id),
    updated_by        INT REFERENCES users(id)
);
```

### 3.2 agent_prototype_prompts

```sql
CREATE TABLE agent_prototype_prompts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prototype_id  UUID NOT NULL REFERENCES agent_prototypes(id) ON DELETE CASCADE,

    type          VARCHAR(50) NOT NULL,  -- soul, memory, reasoning, agents, workflow, communication
    name          VARCHAR(255),
    content       TEXT NOT NULL,         -- Markdown 内容

    version       VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    order_index   INT DEFAULT 0,         -- 同类型内的排序

    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by    INT NOT NULL REFERENCES users(id),
    updated_by    INT REFERENCES users(id)
);
```

### 3.3 agent_prototype_versions

```sql
CREATE TABLE agent_prototype_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prototype_id    UUID NOT NULL REFERENCES agent_prototypes(id) ON DELETE CASCADE,

    version         VARCHAR(50) NOT NULL,  -- e.g., "1.0.0", "1.1.0"

    -- 发布时的快照（JSON）
    config_snapshot JSON NOT NULL,  -- {model, temperature, max_tokens, status}
    prompt_snapshot JSON NOT NULL,  -- {soul: "1.0.0", memory: "1.0.0", ...}

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
    SOUL = "soul"
    MEMORY = "memory"
    REASONING = "reasoning"

    # Layer 2: Organization - 解决"怎么协作"
    AGENTS = "agents"
    WORKFLOW = "workflow"
    COMMUNICATION = "communication"
```

### API 路由设计

```
/api/v1/agent-prototypes
├── GET    /                         # 列表
├── POST   /                         # 创建
├── GET    /{id}                     # 详情
├── PUT    /{id}                     # 更新
├── DELETE /{id}                      # 删除（仅 draft）
├── POST   /{id}/publish             # 发布新版本
├── GET    /{id}/versions             # 版本历史
└── POST   /{id}/rollback            # 回滚到指定版本

/api/v1/agent-prototype-prompts
├── GET    /?prototype_id={id}       # 列表（按 prototype 过滤）
├── POST   /                         # 创建
├── PUT    /{id}                     # 更新
├── DELETE /{id}                      # 删除
└── GET    /{id}/versions             # 该 prompt 的版本历史
```

### 版本发布流程

```
1. 编辑 Prototype 配置和 Prompts
2. 调用 POST /{id}/publish
3. 系统生成新 version（如 1.1.0）
4. 创建 agent_prototype_versions 快照记录
5. 更新 agent_prototypes 的 prompt_selections
```

### 回滚流程

```
1. 调用 POST /{id}/rollback，指定目标 version
2. 从 agent_prototype_versions 读取快照
3. 恢复 config_snapshot 和 prompt_snapshot 到 agent_prototypes
4. 记录回滚操作到历史（作为新版本）
```

## Risks / Trade-offs

**[Risk] JSON 字段不利于数据库层面验证**
→ Mitigation: 在应用层校验 prompt_selections 的结构，确保 type 和 version 匹配已存在的 prompt 记录

**[Risk] 提示词类型扩展需要代码修改**
→ Mitigation: AgentPromptType 设计为有限枚举，未来扩展需要明确评审；JSON 结构向前兼容（不使用的 type 可忽略）

**[Risk] 大文本 content 字段**
→ Mitigation: 使用 TEXT 类型而非 VARCHAR，MySQL 可存储最多 65535 字节；对于超长内容可考虑分表或压缩存储

## Open Questions

1. **原型复制功能**：是否需要支持从现有原型复制一个新原型？
2. **提示词差异对比**：发布时是否需要对比与上一版本的差异？
3. **归档处理**：archived 的原型是否还允许回滚？
