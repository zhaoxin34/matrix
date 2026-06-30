---
id: 02-backend-api
title: 02-后端 API 设计
sidebar_position: 2
author: Joky.Zhao
created: 2026-06-30
updated: 2026-06-30
version: 1.0.0
tags: [knowledge-base, technical, api]
---

## 1. 概述

本文档定义 Neo 平台**知识库与问答库子系统**的后端 API 设计。

### 1.1 基础规范

- **基础路径**：`/api/v1/workspaces/{workspace_code}/knlg-base/...`
- **响应格式**：遵循 [前后端 API 接口规范](../index)
- **认证**：JWT Token（Neo 平台统一）
- **权限校验**：基于 Workspace 角色
- **数据隔离**：所有 API 自动注入 `workspace_id` 过滤

### 1.2 模块路径前缀

| 模块 | 路径前缀 |
| --- | --- |
| 问答库 | `/api/v1/workspaces/{code}/knlg-base/qa/...` |
| 知识库 | `/api/v1/workspaces/{code}/knlg-base/knowledge/...` |
| 规则库 | `/api/v1/workspaces/{code}/knlg-base/rules/...` |
| 知识导入 | `/api/v1/workspaces/{code}/knlg-base/import/...` |
| 候选人审 | `/api/v1/workspaces/{code}/knlg-base/candidates/...` |
| AI 访谈 | `/api/v1/workspaces/{code}/knlg-base/interview/...` |

---

## 2. 通用约定

### 2.1 分页参数

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` | int | 1 | 页码（从 1 开始） |
| `page_size` | int | 20 | 每页数量（最大 100） |

### 2.2 响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

### 2.3 错误码

| 错误码 | 说明 | HTTP |
| --- | --- | --- |
| 0 | 成功 | 200 |
| 1001 | 参数验证失败 | 400 |
| 1002 | 未授权 | 401 |
| 1003 | 禁止访问 | 403 |
| 1004 | 资源不存在 | 404 |
| 1005 | 资源冲突 | 409 |
| 5001 | LLM 调用失败 | 500 |
| 5002 | 文档解析失败 | 500 |
| 5003 | 数据挖掘失败 | 500 |
| 5004 | 规则评估失败 | 500 |
| 9001 | 服务器内部错误 | 500 |

### 2.4 权限矩阵

| 操作 | Owner | Admin | Member | Visitor |
| --- | --- | --- | --- | --- |
| 读取所有资源 | ✅ | ✅ | ✅ | ✅ |
| 创建 Question / Document / Rule | ✅ | ✅ | ✅ | ❌ |
| 回答 Interview | ✅ | ✅ | ✅ | ❌ |
| 审核 CandidateKC | ✅ | ✅ | ❌ | ❌ |
| 发布 / 废弃 KnowledgeCard | ✅ | ✅ | ❌ | ❌ |
| 发布 / 废弃 Rule | ✅ | ✅ | ❌ | ❌ |

---

## 3. 问答库 API

### 3.1 问题树模板

#### 3.1.1 创建问题树

```
POST /api/v1/workspaces/{code}/knlg-base/qa/question-trees
```

**请求体**：

```json
{
  "name": "商机资格判断访谈模板",
  "domain": "opportunity",
  "description": "用于评估商机的真伪",
  "questions": [
    {
      "id": "Q1",
      "text": "什么样的客户最值得跟？",
      "followups": ["有什么特征？", "能举例吗？"]
    }
  ]
}
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "version": "1.0",
    "created_at": "2026-06-30T..."
  }
}
```

#### 3.1.2 列表问题树

```
GET /api/v1/workspaces/{code}/knlg-base/qa/question-trees
```

**查询参数**：`domain`、`is_active`、`page`、`page_size`

#### 3.1.3 问题树详情

```
GET /api/v1/workspaces/{code}/knlg-base/qa/question-trees/{id}
```

#### 3.1.4 更新问题树（创建新版本）

```
PUT /api/v1/workspaces/{code}/knlg-base/qa/question-trees/{id}
```

### 3.2 问题（Question）

#### 3.2.1 创建问题

```
POST /api/v1/workspaces/{code}/knlg-base/qa/questions
```

#### 3.2.2 列表问题

```
GET /api/v1/workspaces/{code}/knlg-base/qa/questions
```

**查询参数**：

- `domain`：领域
- `status`：状态
- `tags`：标签（多个用逗号分隔）
- `keyword`：全文检索关键字
- `tree_id`：所属问题树

#### 3.2.3 问题详情

```
GET /api/v1/workspaces/{code}/knlg-base/qa/questions/{id}
```

**响应**包含：问题基本信息 + 所有 Interview + QA 数量

#### 3.2.4 更新问题

```
PUT /api/v1/workspaces/{code}/knlg-base/qa/questions/{id}
```

#### 3.2.5 归档问题（不删除）

```
PATCH /api/v1/workspaces/{code}/knlg-base/qa/questions/{id}/archive
```

### 3.3 会话与访谈

#### 3.3.1 创建会话

```
POST /api/v1/workspaces/{code}/knlg-base/qa/sessions
```

**请求体**：

```json
{
  "topic": "销售方法论访谈",
  "mode": "ai_agent",
  "expert_id": 123
}
```

#### 3.3.2 创建访谈

```
POST /api/v1/workspaces/{code}/knlg-base/qa/interviews
```

**请求体**：

```json
{
  "session_id": 1,
  "question_id": 100,
  "mode": "ai_agent"
}
```

#### 3.3.3 访谈详情

```
GET /api/v1/workspaces/{code}/knlg-base/qa/interviews/{id}
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "session_id": 1,
    "question_id": 100,
    "expert_id": 123,
    "summary": "AI 自动生成的总结",
    "qa_list": [
      {
        "id": 1,
        "sequence": 1,
        "question": "什么样的客户最值得跟？",
        "answer": "制造业客户...",
        "type": "initial",
        "confidence": 0.85,
        "metadata": {
          "signals_detected": ["industry_manufacturing"]
        }
      }
    ],
    "started_at": "...",
    "ended_at": "..."
  }
}
```

#### 3.3.4 结束访谈

```
PATCH /api/v1/workspaces/{code}/knlg-base/qa/interviews/{id}/end
```

### 3.4 QA（一问一答）

#### 3.4.1 创建 QA（手动或 AI 写入）

```
POST /api/v1/workspaces/{code}/knlg-base/qa/qa-units
```

**请求体**：

```json
{
  "interview_id": 1,
  "sequence": 1,
  "question": "什么样的客户最值得跟？",
  "answer": "制造业客户通常更易成交，因为采购流程规范。",
  "type": "initial",
  "confidence": 0.8,
  "source_case_ids": ["OPP-123"],
  "tags": ["opportunity", "qualification"]
}
```

#### 3.4.2 QA 检索

```
GET /api/v1/workspaces/{code}/knlg-base/qa/qa-units
```

**查询参数**：

- `keyword`：全文检索
- `type`：类型筛选
- `expert_id`：按专家
- `tags`：按标签
- `start_date` / `end_date`：时间范围
- `is_counter_example`：只看反例

#### 3.4.3 QA 详情

```
GET /api/v1/workspaces/{code}/knlg-base/qa/qa-units/{id}
```

**响应**包含：QA 信息 + 引用关系 + 被引用的知识卡片

#### 3.4.4 添加 QA 引用

```
POST /api/v1/workspaces/{code}/knlg-base/qa/qa-units/{id}/refs
```

**请求体**：

```json
{
  "target_qa_id": 200,
  "relation": "support",
  "note": "支持此观点"
}
```

---

## 4. 知识库 API

### 4.1 知识卡片

#### 4.1.1 创建知识卡片

```
POST /api/v1/workspaces/{code}/knlg-base/knowledge/cards
```

**请求体**：

```json
{
  "title": "假商机识别",
  "statement": "当商机同时具备多个风险信号时，假概率显著上升",
  "domain": "opportunity",
  "type": "risk",
  "key_signals": [
    {"name": "decision_maker_missing", "description": "决策人不主动出面"}
  ],
  "conditions": "适用于民营企业",
  "exceptions": "政府客户不适用",
  "confidence": 0.82,
  "source_qa_ids": [1, 2, 3],
  "source_doc_ids": [],
  "source_pattern_ids": [],
  "expert_ids": [123, 124, 125]
}
```

#### 4.1.2 列表知识卡片

```
GET /api/v1/workspaces/{code}/knlg-base/knowledge/cards
```

**查询参数**：

- `domain`、`type`、`status`、`validation_status`
- `keyword`：全文检索
- `min_confidence`：最低置信度
- `tags`

#### 4.1.3 知识卡片详情

```
GET /api/v1/workspaces/{code}/knlg-base/knowledge/cards/{id}
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "title": "假商机识别",
    "statement": "...",
    "key_signals": [...],
    "confidence": 0.82,
    "confidence_breakdown": {
      "expert_agreement": 0.90,
      "source_diversity": 0.85,
      "cross_source_consistency": 0.80
    },
    "validation_status": "validated",
    "source_refs": [
      {
        "source_type": "expert_interview",
        "source_id": 1,
        "source_excerpt": "客户连续 3 次改会...",
        "contribution_weight": 0.4
      }
    ],
    "version": "1.2",
    "status": "published",
    "published_at": "..."
  }
}
```

#### 4.1.4 更新知识卡片（创建新版本）

```
PUT /api/v1/workspaces/{code}/knlg-base/knowledge/cards/{id}
```

#### 4.1.5 版本历史

```
GET /api/v1/workspaces/{code}/knlg-base/knowledge/cards/{id}/versions
```

#### 4.1.6 版本对比

```
GET /api/v1/workspaces/{code}/knlg-base/knowledge/cards/{id}/versions/{v1}/diff/{v2}
```

#### 4.1.7 发布知识卡片

```
POST /api/v1/workspaces/{code}/knlg-base/knowledge/cards/{id}/publish
```

#### 4.1.8 废弃知识卡片

```
POST /api/v1/workspaces/{code}/knlg-base/knowledge/cards/{id}/deprecate
```

**请求体**：

```json
{
  "reason": "业务变更，不再适用"
}
```

---

## 5. 候选知识卡片 API

### 5.1 候选列表

```
GET /api/v1/workspaces/{code}/knlg-base/candidates
```

**查询参数**：

- `validation_status`：`pending` / `validating` / `validated` / `rejected` 等
- `min_confidence`
- `job_id`

### 5.2 候选详情

```
GET /api/v1/workspaces/{code}/knlg-base/candidates/{id}
```

### 5.3 候选审核（通过 / 拒绝）

```
POST /api/v1/workspaces/{code}/knlg-base/candidates/{id}/review
```

**请求体**：

```json
{
  "decision": "approve",  // approve | reject | trigger_interview
  "note": "审核备注",
  "edited_card": {
    "title": "...",
    "statement": "..."
  }
}
```

### 5.4 触发反向访谈

```
POST /api/v1/workspaces/{code}/knlg-base/candidates/{id}/trigger-interview
```

**请求体**：

```json
{
  "expert_id": 123,
  "generated_questions": [
    "你当时为什么把阈值定在 3 次？",
    "有没有反例？"
  ]
}
```

---

## 6. 规则库 API

### 6.1 规则

#### 6.1.1 创建规则

```
POST /api/v1/workspaces/{code}/knlg-base/rules
```

**请求体**：

```json
{
  "name": "商机阶段性停滞预警",
  "description": "...",
  "source_kc_id": 1,
  "scope": {
    "customer_type": "enterprise_民营"
  },
  "trigger": {
    "type": "event_subscription",
    "event_name": "opportunity.stage_changed",
    "filter": [
      {"field": "metadata.days_in_stage", "operator": ">=", "value": 60}
    ],
    "target_entity": {"from": "event.entity_name"}
  },
  "conditions": {
    "all_of": [
      {"field": "metadata.days_in_stage", "operator": ">=", "value": 60}
    ]
  },
  "conclusion": {
    "action": "notify_sales_to_review",
    "risk_level": "medium",
    "notification": {
      "title": "商机停滞预警",
      "body": "..."
    }
  },
  "exceptions": [
    {"field": "metadata.customer_type", "in": ["government"]}
  ]
}
```

#### 6.1.2 列表规则

```
GET /api/v1/workspaces/{code}/knlg-base/rules
```

**查询参数**：

- `status`、`source_kc_id`、`min_confidence`
- `trigger_type`：触发类型

#### 6.1.3 规则详情

```
GET /api/v1/workspaces/{code}/knlg-base/rules/{id}
```

#### 6.1.4 更新规则

```
PUT /api/v1/workspaces/{code}/knlg-base/rules/{id}
```

#### 6.1.5 发布规则（draft → testing → active）

```
POST /api/v1/workspaces/{code}/knlg-base/rules/{id}/publish
```

**请求体**：

```json
{
  "stage": "testing",  // testing | active
  "rollout_percentage": 10
}
```

#### 6.1.6 暂停规则

```
POST /api/v1/workspaces/{code}/knlg-base/rules/{id}/pause
```

#### 6.1.7 废弃规则

```
POST /api/v1/workspaces/{code}/knlg-base/rules/{id}/deprecate
```

### 6.2 Evidence

#### 6.2.1 关联 Evidence（手动）

```
POST /api/v1/workspaces/{code}/knlg-base/rules/{id}/evidences
```

**请求体**：

```json
{
  "case_source": "opportunity",
  "case_id": 123,
  "outcome": "lost_after_90_days",
  "matched_rule": true,
  "support_score": 0.85,
  "validator_type": "expert_judgement"
}
```

#### 6.2.2 Evidence 列表

```
GET /api/v1/workspaces/{code}/knlg-base/rules/{id}/evidences
```

### 6.3 回测

#### 6.3.1 配置回测

```
POST /api/v1/workspaces/{code}/knlg-base/rules/{id}/backtest
```

**请求体**：

```json
{
  "sql_template": "SELECT ... FROM opportunities WHERE ...",
  "params": {
    "start_date": "2025-01-01",
    "end_date": "2026-06-01"
  }
}
```

#### 6.3.2 回测结果

```
GET /api/v1/workspaces/{code}/knlg-base/rules/{id}/backtest/{task_id}
```

### 6.4 规则执行日志

```
GET /api/v1/workspaces/{code}/knlg-base/rules/executions
```

**查询参数**：

- `rule_id`、`entity_name`
- `start_date` / `end_date`
- `user_action`

---

## 7. 知识导入 API

### 7.1 文档管理

#### 7.1.1 上传文档

```
POST /api/v1/workspaces/{code}/knlg-base/import/documents/upload
```

**请求**：`multipart/form-data`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `file` | File | 文档文件 |
| `name` | string | 文档名称（可选，默认用文件名） |
| `type` | string | 文档类型 |

#### 7.1.2 从 Confluence 导入

```
POST /api/v1/workspaces/{code}/knlg-base/import/documents/from-confluence
```

**请求体**：

```json
{
  "space_key": "SALES",
  "page_ids": ["12345", "67890"]
}
```

#### 7.1.3 文档列表

```
GET /api/v1/workspaces/{code}/knlg-base/import/documents
```

### 7.2 导入任务

#### 7.2.1 触发导入任务

```
POST /api/v1/workspaces/{code}/knlg-base/import/jobs
```

**请求体**：

```json
{
  "document_id": 1
}
```

#### 7.2.2 任务详情与进度

```
GET /api/v1/workspaces/{code}/knlg-base/import/jobs/{id}
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "status": "extracting",
    "progress": 0.65,
    "result_summary": {
      "chunks_total": 50,
      "chunks_decision_experience": 12,
      "candidates_generated": 8
    }
  }
}
```

#### 7.2.3 任务列表

```
GET /api/v1/workspaces/{code}/knlg-base/import/jobs
```

---

## 8. AI 访谈 API

### 8.1 AI 访谈会话（流式响应）

```
POST /api/v1/workspaces/{code}/knlg-base/interview/sessions
Content-Type: application/json
Accept: text/event-stream
```

**请求体**：

```json
{
  "expert_id": 123,
  "tree_id": 1,
  "initial_question_id": 100
}
```

**响应**：SSE 流式响应

```
event: message
data: {"type": "question", "text": "什么样的客户最值得跟？"}

event: message
data: {"type": "thinking", "text": "正在分析..."}

event: message
data: {"type": "signal_detected", "signal": "industry_manufacturing"}

event: message
data: {"type": "followup", "text": "能举 1-2 个具体例子吗？"}

event: done
data: {"status": "completed"}
```

### 8.2 提交专家回答（流式）

```
POST /api/v1/workspaces/{code}/knlg-base/interview/sessions/{id}/answer
```

**请求体**：

```json
{
  "qa_id": 1,
  "answer": "制造业客户..."
}
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "next_question": {
      "text": "能举 1-2 个具体例子吗？",
      "reason": "要求案例"
    },
    "signals_detected": [
      {"name": "industry_manufacturing", "confidence": 0.85}
    ]
  }
}
```

### 8.3 结束访谈（AI 总结）

```
POST /api/v1/workspaces/{code}/knlg-base/interview/sessions/{id}/end
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "summary": "本访谈共讨论 8 个问题...",
    "key_signals": [...],
    "suggested_knowledge_cards": [
      {
        "title": "假商机识别",
        "statement": "...",
        "candidate_confidence": 0.78
      }
    ]
  }
}
```

### 8.4 LLM 调用日志（调试用）

```
GET /api/v1/workspaces/{code}/knlg-base/interview/llm-logs
```

**查询参数**：`session_id`、`expert_id`、`start_date` / `end_date`

---

## 9. Agent Steer 集成 API

### 9.1 Event 流订阅（Trigger 引擎内部使用）

**这是 Trigger 引擎订阅 Agent Steer Event 的内部接口**，不是给前端用的。

```
POST /internal/v1/event-stream/subscribe
```

**请求体**：

```json
{
  "subscriber": "knlg-base-trigger",
  "event_names": ["opportunity.stage_changed", "lead.assigned"],
  "callback": "http://knlg-base-trigger.internal/events"
}
```

### 9.2 Rule 加载接口（给 Agent Memory）

```
GET /api/v1/workspaces/{code}/knlg-base/rules/load
```

**查询参数**：

- `entity_name`：按实体名过滤
- `trigger_type`：按触发类型

**响应**：

```json
{
  "code": 0,
  "data": {
    "rules": [
      {
        "id": 1,
        "name": "...",
        "trigger": {...},
        "conditions": {...},
        "conclusion": {...}
      }
    ],
    "loaded_at": "..."
  }
}
```

### 9.3 执行反馈上报

```
POST /api/v1/workspaces/{code}/knlg-base/rules/executions/{id}/feedback
```

**请求体**：

```json
{
  "user_action": "adopted",  // adopted | ignored | no_action
  "outcome": "won"  // optional
}
```

---

## 10. LLM 管理 API（管理员）

### 10.1 Provider 管理

```
GET    /api/v1/llm/providers
POST   /api/v1/llm/providers
PUT    /api/v1/llm/providers/{id}
DELETE /api/v1/llm/providers/{id}
```

### 10.2 Model 管理

```
GET    /api/v1/llm/models
POST   /api/v1/llm/models
PUT    /api/v1/llm/models/{id}
```

### 10.3 Prompt 模板管理

```
GET    /api/v1/llm/prompts
POST   /api/v1/llm/prompts
PUT    /api/v1/llm/prompts/{id}
```

**请求体**：

```json
{
  "name": "interview_opening",
  "category": "interview",
  "version": "1.1",
  "template": "你是{role}。给定主题：{topic}...",
  "variables": [
    {"name": "role", "type": "string"},
    {"name": "topic", "type": "string"}
  ],
  "model_id": 1,
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

---

## 11. 数据统计 API

### 11.1 问答库统计

```
GET /api/v1/workspaces/{code}/knlg-base/qa/stats
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "total_questions": 156,
    "total_interviews": 23,
    "total_qa_units": 412,
    "qa_by_expert": [...],
    "qa_by_domain": [...]
  }
}
```

### 11.2 知识库统计

```
GET /api/v1/workspaces/{code}/knlg-base/knowledge/stats
```

### 11.3 规则库统计

```
GET /api/v1/workspaces/{code}/knlg-base/rules/stats
```

### 11.4 规则健康度

```
GET /api/v1/workspaces/{code}/knlg-base/rules/{id}/health
```

**响应**：

```json
{
  "code": 0,
  "data": {
    "load_count": 1234,
    "trigger_count": 89,
    "hit_rate": 0.072,
    "precision": 0.85,
    "recall": 0.62,
    "false_positive_count": 12,
    "false_negative_count": 23,
    "last_trigger_at": "...",
    "health_status": "good"  // good | warning | critical
  }
}
```

---

## 12. 错误码完整表

| 错误码 | 说明 | HTTP | 触发场景 |
| --- | --- | --- | --- |
| 0 | 成功 | 200 | - |
| 1001 | 参数验证失败 | 400 | 字段缺失、格式错误 |
| 1002 | 未授权 | 401 | Token 无效 / 过期 |
| 1003 | 禁止访问 | 403 | 跨 Workspace 访问 |
| 1004 | 资源不存在 | 404 | ID 不存在 |
| 1005 | 资源冲突 | 409 | 重复创建 |
| 1101 | 置信度超范围 | 400 | confidence 不在 0-1 |
| 1102 | 引用不存在 | 400 | source_qa_ids 含无效 ID |
| 1201 | Prompt 变量缺失 | 400 | 模板变量未提供 |
| 1202 | Model 未启用 | 400 | 模型 disabled |
| 5001 | LLM 调用失败 | 500 | API 错误 |
| 5002 | 文档解析失败 | 500 | 文件格式不支持 |
| 5003 | 数据挖掘失败 | 500 | SQL 执行错误 |
| 5004 | 规则评估失败 | 500 | 条件语法错误 |
| 5005 | 文档导入失败 | 500 | Confluence API 错误 |
| 6001 | 操作被限流 | 429 | LLM 调用超限 |
| 9001 | 服务器内部错误 | 500 | 未捕获异常 |

---

## 🔗 相关文档

- [技术设计总览](./index)
- [01-数据库 schema 设计](./01-database-schema)
- [03-前端模块拆分](./03-frontend-modules)
- [前后端 API 接口规范](../index)
- [知识库与问答库产品设计（总览）](../../product/knlg-base/)

---

## ✅ 设计检查清单

- [x] 所有模块的 API 端点
- [x] 请求/响应 schema
- [x] 错误码体系
- [x] 权限矩阵
- [x] 分页与查询参数
- [x] 与 Agent Steer 集成接口
- [x] LLM 管理接口
- [x] 数据统计接口
