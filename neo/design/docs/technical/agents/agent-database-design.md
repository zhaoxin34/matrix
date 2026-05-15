---
id: agent-prototype-database-design
title: Agent Prototype 数据库设计
sidebar_position: 10
author: Joky.Zhao
created: 2026-05-15
updated: 2026-05-15
version: 1.0.0
tags: [Agent, Database]
---

## 📊 数据模型

### 1.1 Agent Prototype实体

| 属性          | 类型              | 约束                    | 说明                       |
| ------------- | ----------------- | ----------------------- | -------------------------- |
| `id`          | BigInteger        | PK, 自增                | 唯一标识符                 |
| `code`        | String(32)        | UK, NOT NULL, 索引      | Agent Prototype 唯一标识符 |
| `name`        | String(64)        | NOT NULL                | 展示名称                   |
| `description` | Text              | NULL                    | 描述信息                   |
| `version`     | String(32)        | NULL                    | 当前发布的版本号           |
| `model`       | String(64)        | NOT NULL                | 模型配置                   |
| `prompts`     | JSON              | NOT NULL, 默认 `{}`     | 提示词配置                 |
| `status`      | Enum(AgentStatus) | NOT NULL, 默认 draft    | 状态                       |
| `created_by`  | Integer           | FK → users.id, NOT NULL | 创建人                     |
| `created_at`  | DateTime          | NOT NULL                | 创建时间                   |
| `updated_at`  | DateTime          | NOT NULL                | 更新时间                   |

**索引设计**：

| 索引名                    | 字段         | 类型   | 说明             |
| ------------------------- | ------------ | ------ | ---------------- |
| `idx_agent_pt_code`       | `code`       | UNIQUE | 按 code 快速查找 |
| `idx_agent_pt_status`     | `status`     | INDEX  | 按状态筛选       |
| `idx_agent_pt_created_by` | `created_by` | INDEX  | 按创建人筛选     |

### 1.2 AgentPrototypeVersion 实体

| 属性                 | 类型       | 约束                              | 说明                   |
| -------------------- | ---------- | --------------------------------- | ---------------------- |
| `id`                 | Integer    | PK, 自增                          | 唯一标识符             |
| `agent_prototype_id` | Integer    | FK → agent_prototype.id, NOT NULL | 关联的 Agent Prototype |
| `version`            | String(32) | NOT NULL                          | 版本号，如 `1.0.0`     |
| `prompts_snapshot`   | JSON       | NOT NULL                          | 发布时的提示词快照     |
| `config_snapshot`    | JSON       | NOT NULL                          | 发布时的配置快照       |
| `change_summary`     | Text       | NULL                              | 变更说明               |
| `created_by`         | Integer    | FK → users.id, NOT NULL           | 发布人                 |
| `created_at`         | DateTime   | NOT NULL                          | 发布时间               |

**索引设计**：

| 索引名                      | 字段                 | 类型  | 说明                  |
| --------------------------- | -------------------- | ----- | --------------------- |
| `idx_agent_version_agent`   | `agent_prototype_id` | INDEX | 按 Agent 快速查找版本 |
| `idx_agent_version_created` | `created_at`         | INDEX | 按时间排序            |

### 1.3 枚举值说明

#### AgentStatus (Agent 状态)

| 值         | 说明                    |
| ---------- | ----------------------- |
| `draft`    | 草稿 - 初始状态，可编辑 |
| `enabled`  | 启用 - 已发布，可被调用 |
| `disabled` | 禁用 - 已下线，不可调用 |

---

## 🔧 设计决策

### 2.1 Prompts 直接存储

**决定**：Agent 表直接用 `prompts: JSON` 字段存储所有提示词内容，不再单独关联表。

**理由**：

- Prompts 和 Agent 版本天然一致，无需单独维护映射关系
- 简化数据模型，减少关联查询
- 编辑时无需关心版本管理

### 2.2 使用 BIGINT 自增主键

**决定**：所有表使用 BIGINT 自增主键，替代 UUID。

**理由**：

- 更简洁的 API URL
- 更易调试
- MySQL 索引性能更好

### 2.3 版本快照分离

**决定**：AgentVersion 表独立存储 prompts_snapshot 和 config_snapshot。

**理由**：

- 发布时的完整状态可追溯
- 支持任意版本回滚
- 快照不可变，保证数据一致性

---

## ⚠️ 设计约束

| 约束         | 说明                                                |
| ------------ | --------------------------------------------------- |
| Prompts 长度 | 使用 TEXT 类型，最大 65535 字节；超长内容需考虑压缩 |
| JSON 验证    | 应用层校验 prompts 必须包含所有必需 type            |
| 删除限制     | 仅 draft 状态的 Agent 可删除                        |
| 状态切换     | enabled ↔ disabled 可互相切换                       |

---

## 🔗 相关文档

- [Agent Prototype 管理产品设计](../admin/agent-prototype-management)
- [Agent 任务系统设计](./agent-task-design)
- [Agent 嵌入设计](./agent-ingest)
