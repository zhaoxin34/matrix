# Agent Model Provider - Technical Design

## Context

当前 Agent Prototype 使用简单的 `model: "gpt-4"` 字符串字段来指定模型。这种方式存在以下问题：

1. **灵活性差**：无法在不修改代码的情况下切换模型或供应商
2. **配置分散**：模型参数（temperature、max_tokens 等）硬编码在 Agent 级别
3. **不支持多供应商**：无法方便地接入 Ollama、本地模型等
4. **密钥管理缺失**：API Key 无法统一管理

参考 pi 的 `models.json` 配置方式，设计一套可扩展的 ModelProvider 架构。

## Goals / Non-Goals

**Goals:**

- 支持多模型供应商统一管理
- 支持 Provider 级别配置（baseUrl、API 类型、API Key 引用）
- 支持 Model 级别配置（contextWindow、maxTokens、thinking 等）
- 支持环境变量引用 API Key
- 与现有 AgentPrototype 兼容

**Non-Goals:**

- 不实现模型的实际调用（由运行时 Agent 执行）
- 不实现模型发现/动态注册（静态配置）
- 不实现复杂的模型路由/负载均衡
- 不复用知识库的 knlg_llm_provider 表（独立设计）

## Decisions

### Decision 1: 数据模型分层设计

**选择**：采用 `ModelProvider` → `ModelConfig` 两层模型

**理由**：

- Provider 层：管理连接配置（baseUrl、api 类型、认证信息）
- Model 层：管理模型元数据（模型 ID、参数限制、特性支持）

**替代方案考虑**：

- 单表设计：将 Provider 和 Model 合并，单表包含所有字段
  - 缺点：配置冗余，每个模型都要重复 baseUrl、apiKey 等
- 三层设计：Provider → Model → ModelVersion
  - 缺点：过度设计，当前场景不需要版本管理

### Decision 2: API Key 管理方式

**选择**：环境变量引用（`$API_KEY` 格式）

**理由**：

- 安全性：密钥不存储在数据库明文中
- 灵活性：同一 Provider 可切换不同环境（dev/staging/prod）
- 符合 pi 设计理念

**替代方案考虑**：

- 数据库加密存储
  - 缺点：需要额外的密钥管理，增加复杂度
- 外部密钥管理服务（Vault）
  - 缺点：引入额外依赖，增加运维成本

### Decision 3: 与现有设计的关系

**选择**：新建独立的 `agent_model_provider` 和 `agent_model_config` 表

**理由**：

- 隔离性：Agent 系统的模型配置与知识库系统解耦
- 灵活性：Agent 可能有独特的模型需求（如 thinking_level）
- 可演进：独立发展，不受其他系统影响

**替代方案考虑**：

- 复用知识库的 knlg_llm_provider/knlg_llm_model
  - 缺点：表结构耦合，字段可能不匹配
  - 知识库的表设计针对 AI 访谈场景，有特定字段

### Decision 4: AgentPrototype 字段设计

**选择**：新增 `provider_id`、`model_id`、`model_config` 字段，保留 `model` 字段

**理由**：

- 向后兼容：旧数据可继续使用 `model` 字段
- 渐进迁移：新数据使用新字段，旧数据可后续迁移
- 灵活配置：`model_config` 支持运行时参数覆盖

## Data Model

### ModelProvider 表

```sql
CREATE TABLE agent_model_provider (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL COMMENT 'Provider 唯一标识',
    name VARCHAR(64) NOT NULL COMMENT '显示名称',
    description VARCHAR(500) NULL,
    api_type VARCHAR(32) NOT NULL COMMENT 'API 类型: openai-completions/anthropic-messages 等',
    base_url VARCHAR(512) NULL COMMENT 'API 端点 URL',
    api_key_env VARCHAR(128) NULL COMMENT 'API Key 环境变量名，如 OPENAI_API_KEY',
    headers JSON NULL COMMENT '自定义请求头',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### ModelConfig 表

```sql
CREATE TABLE agent_model_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    provider_id BIGINT NOT NULL COMMENT '关联的 Provider',
    model_id VARCHAR(64) NOT NULL COMMENT '模型标识符，如 gpt-4、claude-3-5-sonnet',
    display_name VARCHAR(128) NULL COMMENT '显示名称',
    context_window INT DEFAULT 128000 COMMENT '上下文窗口大小',
    max_tokens INT DEFAULT 4096 COMMENT '最大输出 token',
    supports_thinking BOOLEAN DEFAULT FALSE COMMENT '是否支持 thinking',
    thinking_level_map JSON NULL COMMENT 'thinking 级别映射',
    input_types JSON DEFAULT '["text"]' COMMENT '输入类型: text, image',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider_model (provider_id, model_id)
);
```

### AgentPrototype 改造

```sql
ALTER TABLE agent_prototype ADD COLUMN provider_id BIGINT NULL;
ALTER TABLE agent_prototype ADD COLUMN model_id VARCHAR(64) NULL;
ALTER TABLE agent_prototype ADD COLUMN model_config JSON NULL;

-- 注释说明
-- model: 保留，向后兼容
-- provider_id + model_id: 新增，推荐使用
-- model_config: 运行时配置，如 { "temperature": 0.7, "thinking": "high" }
```

## API Design

### ModelProvider API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/model-providers` | 列出 Provider |
| POST | `/api/v1/model-providers` | 创建 Provider |
| GET | `/api/v1/model-providers/{id}` | 获取详情 |
| PUT | `/api/v1/model-providers/{id}` | 更新 Provider |
| DELETE | `/api/v1/model-providers/{id}` | 删除 Provider |
| PATCH | `/api/v1/model-providers/{id}/enable` | 启用 |
| PATCH | `/api/v1/model-providers/{id}/disable` | 禁用 |
| GET | `/api/v1/model-providers/{id}/models` | 列出模型 |

### ModelConfig API

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/model-providers/{id}/models` | 列出模型（复用） |
| POST | `/api/v1/model-providers/{id}/models` | 添加模型 |
| PUT | `/api/v1/model-providers/{id}/models/{model_id}` | 更新模型 |
| DELETE | `/api/v1/model-providers/{id}/models/{model_id}` | 删除模型 |

### AgentPrototype API 变更

创建/更新时支持新的模型配置方式：

```json
// 请求体
{
  "name": "客服助手",
  "provider_id": 1,
  "model_id": "gpt-4o",
  "model_config": {
    "temperature": 0.7,
    "thinking": "high"
  }
}
```

响应中包含新的模型信息：

```json
// 响应体
{
  "id": 1,
  "name": "客服助手",
  "model": "gpt-4o",
  "provider_id": 1,
  "model_id": "gpt-4o",
  "model_config": {
    "temperature": 0.7,
    "thinking": "high"
  }
}
```

## 代码结构

```
backend/src/app/
├── models/
│   ├── model_provider.py      # ModelProvider 模型
│   └── model_config.py        # ModelConfig 模型
├── schemas/
│   ├── model_provider.py      # Pydantic schemas
│   └── model_config.py
├── repositories/
│   ├── model_provider_repository.py
│   └── model_config_repository.py
├── services/
│   └── model_provider_service.py
├── api/v1/
│   ├── model_provider.py      # API 路由
│   └── model_config.py
└── routers/
    └── model_provider.py      # 路由聚合
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 环境变量引用无法验证有效性 | 提供健康检查接口，验证 Provider 连接 |
| 旧数据迁移复杂 | 提供迁移脚本，允许新旧字段共存 |
| 模型配置与运行时不一致 | Agent 执行时从 DB 读取最新配置 |

## Migration Plan

### Phase 1: 数据库迁移

1. 创建 `agent_model_provider` 和 `agent_model_config` 表
2. 修改 `agent_prototype` 表，增加新字段

### Phase 2: 后端服务

1. 实现 ModelProviderService
2. 实现 API 端点
3. 修改 AgentPrototypeService，支持新字段

### Phase 3: 数据初始化

1. 预置常用 Provider（OpenAI、Anthropic）
2. 预置常用 Model 配置

### Phase 4: 回滚

- 数据库变更使用 Alembic，可通过 `alembic downgrade` 回滚
- 新字段为 NULL 可空，不影响现有逻辑

## Open Questions

1. **是否需要支持动态模型列表**（如 Ollama 的 `/api/tags`）？
   - 当前设计为静态配置，如需要可扩展 refreshModels 接口

2. **Agent 创建时是否验证 Model 存在**？
   - 建议：验证 provider_id 和 model_id 必须存在且 enabled=true

3. **thinking_level_map 的具体格式**？
   - 参考 pi 设计：{ "off": null, "low": "low", "high": "high" }
