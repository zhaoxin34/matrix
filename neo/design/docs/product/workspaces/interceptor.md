---
id: interceptor
title: 拦截器管理
sidebar_position: 15
author: Joky.Zhao
created: 2026-06-26
updated: 2026-06-28
version: 2.0.0
tags: [workspace, interceptor]
---

## 背景

业务人员每天在目标软件(如 CRM、ERP)里完成大量操作(分配线索、提交订单、审批流程等),这些操作背后是有"业务意图"的(把线索分配给张三 → 生成"线索分配"事件)。

**拦截器**(Interceptor)是配置在特定网站上的规则，定义：

- **什么时候**触发（DOM 点击 / 网络请求）
- **捕获什么**（操作主体、目标）
- **触发什么 action**（生成 Event、采集 Status、弹确认等）

> **本期范围**：仅实现拦截器的 CRUD 管理 + API 暴露。Extension 执行部分在后续阶段实现。

## 目标

1. 管理员能在 Neo 前端**配置和管理**拦截器规则
2. 后端提供 **API 供 Extension 查询**启用的拦截器列表

## 用户故事

### 故事 1:管理员配置拦截器

> 作为**销售运营管理员**,我希望
> 在 Neo 前端 workspace 下创建"分配线索"拦截器,
> 绑定到销售 CRM 网站、配置 trigger 和 actions,
> 这样 Extension 加载时可以获取规则并执行。

### 故事 2:管理员管理拦截器

> 作为**销售运营管理员**,我希望
> 能启用/禁用已有的拦截器,
> 这样在调试或调整时可以临时关闭,不影响其他规则。

## 数据模型

### 拦截器结构

| 字段 | 说明 |
|------|------|
| name | 拦截器名称（如"分配线索确认"） |
| embedded_site_id | 绑定的网站 |
| event_name | 触发后上报的 Event 名（如 `lead.assigned`） |
| mode | 模式：`observe`（仅观察）或 `intercept`（拦截） |
| entity_name | 被操作的实体名（主语） |
| target_entity_name | 操作的目标实体名（宾语） |
| trigger | trigger 配置（DOM 选择器或网络 URL pattern） |
| before_actions | 触发前执行的动作列表 |
| after_actions | 触发后执行的动作列表 |
| page_url_pattern | 限定生效的页面 URL（可选） |
| debounce_ms | 防重入时间（默认 1000ms） |
| status | 状态：`ENABLED` 或 `DISABLED` |

### 关联关系

```
Workspace
  └── EmbeddedSite
        └── Interceptor (绑定到 site)
```

## 功能清单

### CRUD 功能

| 功能 | 说明 |
|------|------|
| 创建拦截器 | 填写 name、绑定 site、配置 trigger 和 actions |
| 查看列表 | 分页展示，支持按 site 筛选 |
| 查看详情 | 查看拦截器完整配置 |
| 编辑拦截器 | 修改任意可编辑字段 |
| 删除拦截器 | 软删除（改为 DISABLED 状态） |
| 启用/禁用 | 切换 status 状态 |

### API 暴露

| 用途 | API |
|------|-----|
| Extension 查询 | `GET /api/v1/workspaces/{workspace_code}/interceptors?embedded_site_id=X&status=ENABLED` |

---

## 🔗 相关文档

- [拦截器管理技术设计](../../technical/workspaces/interceptor) - 数据模型、API、状态机
- [嵌入网站管理](./embedded-site) - 拦截器绑定的 site
- [事件管理](./events) - interceptor 触发的 Event 上报
- [状态管理](./status) - interceptor 触发的 Status 采集

---

## ✅ 设计检查清单

- [x] 路由表注册
- [x] API 路径统一（符合 rules-api.md）
- [ ] 数据库迁移
- [ ] 后端 CRUD API + 单元测试
- [ ] 前端页面
- [ ] E2E 测试用例
