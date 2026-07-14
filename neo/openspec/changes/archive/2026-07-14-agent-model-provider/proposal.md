# Agent Model Provider - Proposal

## Why

当前 Agent Prototype 使用简单的 `model` 字符串字段（如 "gpt-4"）来指定模型，无法灵活切换模型 Provider、配置模型参数，也无法支持多模型供应商（OpenAI、Anthropic、Ollama 等）。随着 Agent 平台的发展，需要引入 ModelProvider 概念，实现模型的统一管理和灵活配置。

参考 pi 的 model provider 设计，支持：

- 多 Provider 统一管理
- 模型参数配置（temperature、thinking、max_tokens 等）
- 环境变量引用 API Key
- Provider 级别和 Model 级别的配置覆盖

## What Changes

- **新增 `model_provider` 表**：存储 Provider 配置（baseUrl、api 类型、API Key 引用等）
- **新增 `model_config` 表**：存储模型配置（contextWindow、maxTokens、thinkingLevelMap 等）
- **AgentPrototype 改造**：
  - 增加 `provider_id` 和 `model_id` 字段替代原有的 `model` 字符串
  - 保留向后兼容（`model` 字段可选）
- **API 层新增**：
  - `GET /api/v1/model-providers` - 列出可用 Provider
  - `POST /api/v1/model-providers` - 创建 Provider
  - `GET /api/v1/model-providers/{id}/models` - 列出 Provider 下的模型
- **Agent 创建时验证**：确保引用的 Provider 和 Model 存在且可用

## Capabilities

### New Capabilities

- `model-provider-management`: ModelProvider 的 CRUD 管理
  - Provider 创建/更新/删除
  - 模型列表查询
  - API Key 环境变量引用
  - Provider 状态管理（启用/禁用）

### Modified Capabilities

- `agent-prototype-design`: Agent Prototype 的模型配置方式变更
  - `model` 字段从字符串改为 `provider_id + model_id` 引用
  - 新增 `model_config` JSON 字段存储模型运行时参数

## Impact

### 数据库

- 新增 `model_provider` 表
- 新增 `model_config` 表
- `agent_prototype` 表增加 `provider_id`、`model_id`、`model_config` 字段

### API

- 新增 ModelProvider 相关 API 端点
- AgentPrototype API 响应结构变更

### 代码

- `backend/src/app/models/` - 新增 ModelProvider、ModelConfig 模型
- `backend/src/app/api/v1/` - 新增 model_provider 路由
- `backend/src/app/services/` - 新增 ModelProviderService
- `backend/src/app/repositories/` - 新增 ModelProviderRepository

### 依赖

- 参考 pi 的 `models.json` 配置方式
- 可复用知识库的 `knlg_llm_provider`/`knlg_llm_model` 表结构设计
