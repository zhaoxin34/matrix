---
id: interview-agent-implementation-plan
title: 访谈 Agent 实施计划
sidebar_position: 30
author: Joky.Zhao
created: 2026-07-14
updated: 2026-07-14
version: 1.0.0
tags: [agent, interview, langgraph, implementation]
---

## 1. 概述

本文档追踪访谈 Agent 的渐进式实施进度。

### 1.1 架构决策

```
┌─────────────────────────────────────────────────────────────┐
│                    Neo 系统架构                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend                                                    │
│     │                                                        │
│     ▼                                                        │
│  ┌─────────────┐        ┌─────────────────┐                │
│  │   Backend   │◄──────►│  agent-service   │                │
│  │  (FastAPI)  │  HTTP  │  (LangGraph)     │                │
│  │             │        │                  │                │
│  │  • CRUD     │        │  • 访谈 Agent     │                │
│  │  • 权限     │        │  • 状态机         │                │
│  │  • 业务逻辑 │        │  • LLM 调用       │                │
│  └──────┬──────┘        └────────┬─────────┘                │
│         │                        │                           │
│         ▼                        ▼                           │
│  ┌─────────────────────────────────────────┐                │
│  │            Shared Database               │                │
│  │  • agent_prototype                       │                │
│  │  • knlg_question_tree                   │                │
│  │  • knlg_interview_turn                  │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 组件 | 技术选择 | 说明 |
|------|---------|------|
| 框架 | LangGraph | 支持循环和状态管理，适合多轮对话 |
| LLM 调用 | langchain-openai | 统一接口，支持多 Provider |
| HTTP Client | httpx | 异步，支持连接池 |
| 配置获取 | Backend API | 通过 HTTP 调用获取 prompts、model |

### 1.3 数据流

```
agent-service ──► Backend API ──► agent_prototype 表
     │                               (获取 prompts、model)
     │
     ▼
LangGraph Agent ──► LLM ──► 访谈状态机
     │
     ▼
存储到数据库
```

---

## 2. 里程碑

### M1: 基础框架搭建 ✅ (待开始)

**目标**：搭建 agent-service 工程，实现基于问题树的简单多轮问答

**交付物**：

- [ ] agent-service 工程目录结构
- [ ] LangGraph 状态机（4 个节点）
- [ ] Backend API 客户端
- [ ] 简单问答 API 端点

**状态**：🟡 待开始

---

### M2: 追问机制

**目标**：实现智能追问功能

**交付物**：

- [ ] 追问触发器实现
- [ ] 追问深度控制
- [ ] 5 种追问类型

**状态**：⚪ 未开始

---

### M3: 实时信号识别

**目标**：在访谈过程中实时识别和标记关键信息

**交付物**：

- [ ] 信号识别节点
- [ ] 自动打标功能
- [ ] 置信度评估

**状态**：⚪ 未开始

---

### M4: 完整访谈流程

**目标**：实现完整的访谈生命周期管理

**交付物**：

- [ ] 访谈会话管理
- [ ] 摘要生成
- [ ] 访谈历史查询

**状态**：⚪ 未开始

---

## 3. 详细设计

### 3.1 工程结构

```
agent-service/
├── src/
│   └── agent_service/
│       ├── __init__.py
│       ├── main.py              # FastAPI 入口
│       ├── config.py             # 配置
│       ├── agents/
│       │   ├── __init__.py
│       │   └── interview/
│       │       ├── __init__.py
│       │       ├── graph.py     # LangGraph 定义
│       │       ├── state.py     # 状态定义
│       │       ├── nodes.py     # 节点实现
│       │       ├── prompts.py   # 提示词模板
│       │       └── tools.py     # 工具函数
│       ├── clients/
│       │   ├── __init__.py
│       │   └── backend.py       # Backend API 客户端
│       ├── schemas/
│       │   ├── __init__.py
│       │   └── interview.py     # Pydantic schemas
│       └── dependencies.py      # 依赖注入
├── tests/
├── pyproject.toml
├── Makefile
└── README.md
```

### 3.2 LangGraph 状态机

```
┌──────────────────────────────────────────────────────────────┐
│                    访谈状态机                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                             │
│  │ start      │                                             │
│  └──────┬──────┘                                             │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                             │
│  │ ask_question│ ──► 发送问题给专家                          │
│  └──────┬──────┘                                             │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                             │
│  │ wait_answer │ ◄── 等待专家回答                            │
│  └──────┬──────┘                                             │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                             │
│  │decide_      │ ──► 判断是否追问                           │
│  │followup     │                                             │
│  └──────┬──────┘                                             │
│         │                                                    │
│    ┌────┴────┐                                               │
│    │         │                                               │
│    ▼         ▼                                               │
│  [追问]    [结束]                                             │
│    │         │                                               │
│    └────┬────┘                                               │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                             │
│  │   end      │                                              │
│  └─────────────┘                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Backend API 接口

#### 3.3.1 获取 Agent 配置

```
GET /api/v1/agent_prototypes/{prototype_id}

Response:
{
  "code": 0,
  "data": {
    "id": 1,
    "name": "interview-agent",
    "model": "gpt-4o",
    "prompts": {
      "system": "你是...",
      "user": "...",
      "assistant": "..."
    },
    "config": {
      "temperature": 0.7,
      "max_tokens": 4096
    }
  }
}
```

#### 3.3.2 开始访谈

```
POST /api/v1/workspaces/{workspace_code}/interviews

Request:
{
  "question_tree_id": 1,
  "expert_id": 1
}

Response:
{
  "code": 0,
  "data": {
    "session_id": 1,
    "interview_id": 1,
    "status": "in_progress"
  }
}
```

#### 3.3.3 获取下一个问题

```
GET /api/v1/interviews/{interview_id}/next-question

Response:
{
  "code": 0,
  "data": {
    "question_id": 1,
    "question_text": "什么样的客户最值得跟？",
    "followups": [
      "这种客户有什么共同特征？",
      "能举 1-2 个具体例子吗？"
    ]
  }
}
```

#### 3.3.4 提交回答

```
POST /api/v1/interviews/{interview_id}/turns

Request:
{
  "question_id": 1,
  "question_text": "什么样的客户最值得跟？",
  "answer_text": "我认为..."
}

Response:
{
  "code": 0,
  "data": {
    "turn_id": 1,
    "suggested_followups": [
      "这种客户有什么共同特征？"
    ],
    "should_end": false
  }
}
```

---

## 4. 实施日志

### 2026-07-14

- [ ] 完成架构设计讨论
- [ ] 确定技术栈：LangGraph + httpx
- [ ] 确定架构方案：Backend + agent-service 混合架构
- [ ] 开始编写实施计划文档

---

## 5. 相关文档

- [问答库产品设计](./design/docs/product/knlg-base/q-a-library.md)
- [Agent Prototype 设计](./design/docs/product/agents/agent-prototype-design.md)
- [Agent Factory 设计](./design/docs/product/workspaces/agent-factory.md)
- [访谈 Agent 技术设计](./design/docs/technical/knlg-base/06-interview-agent.md)

---

## 6. 更新记录

| 日期 | 更新内容 | 作者 |
|------|---------|------|
| 2026-07-14 | 初始版本 | Joky.Zhao |
