# Spec: prompt-management

## Purpose

定义 knlg-base 后端的 Prompt 模板管理能力：基于已有 `knlg_llm_prompt` 表（schema 已存在），支持版本控制 + Jinja2 渲染 + Redis 缓存 + Monaco 编辑器 UI + 工作区私有 Prompt（v2）。

## ADDED Requirements

### Requirement: Prompt 版本控制

The system SHALL support Prompt versioning via `knlg_llm_prompt.version` field. Creating a new version deprecates the old version (does not delete it). Old versions remain queryable for audit.

#### Scenario: 创建 v2

- **WHEN** 现有 Prompt `interview_system` v1.0，用户编辑后保存
- **THEN** 创建 v2.0（active）+ v1.0 自动标 deprecated（不在新调用中使用，但可查询历史 turn 用了哪个版本）

#### Scenario: 回滚到 v1.0

- **WHEN** admin 在 UI 上点击"激活 v1.0"
- **THEN** v1.0 status=active，v2.0 status=deprecated；≤ 30 秒全集群生效

### Requirement: Jinja2 渲染 + 变量校验

The system SHALL render Prompt templates using Jinja2 sandboxed environment, with strict variable whitelist declared in `knlg_llm_prompt.variables` JSON field. Unknown variables cause `KnlgPromptRenderError`.

#### Scenario: 正常渲染

- **WHEN** Prompt template 含 `{{ expert_name }}`，variables 提供 `{"expert_name": "张三"}`
- **THEN** 渲染结果含 "张三"

#### Scenario: 缺失变量

- **WHEN** Prompt template 含 `{{ expert_name }}`，variables 未提供
- **THEN** 抛出 `KnlgPromptRenderError`（错误码 `ERR_PROMPT_MISSING_VAR`）

### Requirement: Redis 缓存（5 分钟 TTL）

The system SHALL cache rendered Prompt results in Redis with key `prompt:{prompt_id}:{hash(variables)}` and TTL 300 seconds. Cache hit rate target ≥ 80% (most interviews reuse same Prompt with same variables).

#### Scenario: 缓存命中

- **WHEN** 同一 Prompt + 同一 variables 第 2 次渲染
- **THEN** Redis 命中，跳过 Jinja2 渲染 + DB 查询

#### Scenario: 缓存失效

- **WHEN** Prompt 内容修改（创建 v2）
- **THEN** 该 Prompt 的所有 cache key 失效（key 前缀删除）

### Requirement: A/B 流量分配（评估）

The system SHALL support A/B testing for Prompts via `knlg_llm_prompt.traffic_split` JSON field (e.g., `{"v1.0": 0.5, "v2.0": 0.5}`). Phase 3 MVP: **enabled but disabled by default** (all traffic to active version).

#### Scenario: A/B 启用

- **WHEN** admin 配置 `traffic_split = {"v1.0": 0.3, "v2.0": 0.7}`
- **THEN** 30% 调用使用 v1.0，70% 使用 v2.0，hash(user_id) 决定分流

### Requirement: Prompt 编辑器 UI（Monaco）

The system SHALL provide a Prompt editor UI at `/workspace/{code}/knlg-base/prompts` using Monaco Editor, with:

- 左侧：模板列表 + 版本号
- 中间：Monaco 编辑器（Jinja2 语法高亮）
- 右侧：变量声明面板（key + type + default + description）
- 底部："试运行"按钮（输入测试 variables 看渲染结果）

#### Scenario: 试运行渲染

- **WHEN** admin 点击"试运行"
- **THEN** 用当前 variables 测试值渲染模板，弹出 preview 面板显示最终 LLM 输入

### Requirement: 调用追溯（Prompt 版本快照）

The system SHALL write a snapshot to `knlg_prompt_version_snapshot` for every LLM call, containing rendered text + variables (desensitized) + prompt_id + version + workspace_id + used_at. Enables "why AI asked this question" audit trail.

#### Scenario: 追溯 AI 问题来源

- **WHEN** 审计人员查看 turn T3（AI 问"客户最讨厌什么？"）
- **THEN** 通过 `prompt_version_snapshot` 查到：prompt=`interview_ask_question` v2.0, variables={expert_name:"张三", last_signal_type:"pain_point"}

## Dependencies

- 依赖 `knlg_llm_prompt` 表（schema 已存在，需 migration 加字段）
- 依赖 Redis（缓存）
- 依赖前端 Monaco Editor

## Cross-References

- 设计文档: [05-prompt-management.md](../../../../design/docs/technical/knlg-base/05-prompt-management)
- Handoff: [PHASE3-DESIGN-HANDOFF §4.5 决策记录](../../../../design/docs/technical/knlg-base/PHASE3-DESIGN-HANDOFF#45-决策记录2026-07-01-评审锁定)
