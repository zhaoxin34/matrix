# Spec: llm-gateway

## Purpose

定义 knlg-base 后端的 LLM 客户端层（Python 轻量客户端 + LiteLLM），使 Phase 3 的 AI 访谈 Agent MVP 能调用多 provider 模型，支持同步与流式（SSE）两种调用模式、限流、降级、可观测。

## ADDED Requirements

### Requirement: Multi-provider LLM 调用

The system SHALL provide a unified LLM client (`KnlgLlmClient`) that wraps LiteLLM and supports at least 3 providers (OpenAI / Anthropic / 国内模型), selected per-call via the `model` parameter in `provider/model_id` format (e.g., `openai/gpt-4o`, `anthropic/claude-3-5-sonnet`, `qwen/qwen-max`).

#### Scenario: 调用 OpenAI 模型

- **WHEN** 调用 `client.chat(model="openai/gpt-4o", messages=[...])`
- **THEN** 返回 OpenAI 模型的响应（`LlmResponse`），tokens_used 与 cost_usd 已计算并填充

#### Scenario: 调用 Anthropic 模型

- **WHEN** 调用 `client.chat(model="anthropic/claude-3-5-sonnet", messages=[...])`
- **THEN** 返回 Anthropic 模型的响应，行为与 OpenAI 一致（统一接口）

### Requirement: 流式 SSE 调用

The system SHALL provide an `async stream()` method on `KnlgLlmClient` that yields `LlmChunk` objects (含 `delta` / `finish_reason` / `usage`) as they arrive from the LLM provider, with no buffering at the client layer.

#### Scenario: 流式输出文字

- **WHEN** 调用 `client.stream(model="openai/gpt-4o", messages=[...])`
- **THEN** 每个 chunk 立刻 yield 给调用方，首个 chunk 延迟（TTFT）< 2 秒（gpt-4o）

### Requirement: 限流（按 user）

The system SHALL enforce a rate limit of **≤ 100 LLM calls per user per hour**, using Redis `INCR` + `EXPIRE`. Exceeding the limit raises `KnlgLlmRateLimitError`.

#### Scenario: 未超限

- **WHEN** 用户 87 次调用 / 小时
- **THEN** 允许调用，Redis key `ratelimit:user:{uid}:hour` INCR 到 88

#### Scenario: 超限

- **WHEN** 用户 101 次调用 / 小时
- **THEN** 调用被拒绝，抛出 `KnlgLlmRateLimitError`（错误码 `ERR_LLM_RATE_LIMIT`）

### Requirement: 降级（fallback model）

The system SHALL support automatic fallback from primary to secondary model when primary fails with retryable error (provider timeout / rate limit / 5xx). Fallback chain configured via `knlg_llm_model.fallback_model_id`.

#### Scenario: 主模型超时，触发降级

- **WHEN** primary model (gpt-4o) 超时（> 30s）
- **THEN** 自动重试 fallback model (gpt-4o-mini)，调用成功并落日志（标记 `fallback_used=True`）

#### Scenario: 主模型 + fallback 均失败

- **WHEN** primary 与 fallback 都失败
- **THEN** 抛出 `KnlgLlmUnavailableError`（错误码 `ERR_LLM_UNAVAILABLE`）

### Requirement: 可观测（调用日志）

The system SHALL write 100% of LLM call records to `knlg_interview_ai_turn.llm_request_log` JSON field, containing: `model` / `prompt_tokens` / `completion_tokens` / `duration_ms` / `ttft_ms` / `finish_reason` / `error`（如有）。

#### Scenario: 成功调用日志

- **WHEN** LLM 调用完成（成功）
- **THEN** `llm_request_log` JSON 含完整 metadata（tokens / cost / duration）

#### Scenario: 失败调用日志

- **WHEN** LLM 调用失败
- **THEN** `llm_request_log` JSON 含 `error.code` 与 `error.message`，但 `tokens_used` 与 `cost_usd` 记录实际消耗（即使失败也计费）

### Requirement: Provider / Model / Prompt 配置（DB 管理）

The system SHALL read provider credentials (api_key / api_base_url), model configs, and prompt templates from MySQL tables (`knlg_llm_provider` / `knlg_llm_model` / `knlg_llm_prompt`), not from environment variables, so that non-engineers can manage them via admin UI.

#### Scenario: 新增 provider 后立即生效

- **WHEN** admin 通过 UI 新增 provider X，配置 api_key
- **THEN** ≤ 30 秒内全集群可调用 provider X（Redis cache 失效）

### Requirement: API Key 加密存储

The system SHALL encrypt all provider `api_key` values at rest using Fernet (AES-128-CBC + HMAC SHA256) with the master key from env (`KNLG_LLM_KEY_ENCRYPTION_KEY`). Plaintext keys MUST NOT appear in DB queries or logs.

#### Scenario: DB dump 不含明文

- **WHEN** `mysqldump` 输出 `knlg_llm_provider` 表
- **THEN** `api_key` 列均为 Fernet ciphertext（`gAAAAA...`），非明文

### Requirement: 错误码归一（4 类）

The system SHALL map provider-specific errors to 4 normalized categories:

| 错误码 | HTTP 类比 | 可重试 |
|---|---|---|
| `ERR_LLM_TIMEOUT` | 504 | ✅ |
| `ERR_LLM_RATE_LIMIT` | 429 | ✅ |
| `ERR_LLM_AUTH` | 401 | ❌ |
| `ERR_LLM_UNAVAILABLE` | 503 | ✅ |

#### Scenario: 错误码映射

- **WHEN** provider 返回 `openai.RateLimitError`
- **THEN** 上抛 `KnlgLlmRateLimitError`（`code="ERR_LLM_RATE_LIMIT"`, `retryable=True`）

### Requirement: LiteLLM 版本策略

The system SHALL pin `litellm` to **latest version** (no version constraint in `pyproject.toml`), with CI integration tests as the safety net. Breaking changes are caught by e2e tests, not by version pinning.

#### Scenario: LiteLLM 升级

- **WHEN** CI 跑 `make test` + `tests/e2e/test_llm_integration.py`
- **THEN** 全部通过则升级到 latest，失败则 revert

### Requirement: Phase 3 与 agent-server 解耦

The system SHALL NOT import any package from `@agegr/*` workspace (agent-server / browser-tool / bb-*) in `backend/src/app/services/knlg_base/llm/`. knlg-base 的 LLM 调用路径完全独立于 agent-server。

#### Scenario: grep 验证无依赖

- **WHEN** `grep -r "@agegr" backend/src/app/services/knlg_base/llm/`
- **THEN** 无任何匹配（exit code 1）

## Dependencies

- 依赖 `litellm` (latest) Python 包
- 依赖 Redis（限流 INCR + EXPIRE）
- 依赖 MySQL 表 `knlg_llm_provider` / `knlg_llm_model` / `knlg_llm_prompt`（已存在）
- 不依赖 `agent-server`

## Cross-References

- 设计文档: [04-llm-gateway.md](../../../../design/docs/technical/knlg-base/04-llm-gateway)
- Handoff: [PHASE3-DESIGN-HANDOFF §4.5 决策记录](../../../../design/docs/technical/knlg-base/PHASE3-DESIGN-HANDOFF#45-决策记录2026-07-01-评审锁定)
