---
id: agent-factory-test-cases
title: Agent Factory 模块
sidebar_position: 20
author: Joky.zhao
created: 2026-05-27
updated: 2026-05-27
version: 1.0.0
---

# Test Cases: Agent Factory 模块

## 概述

- **功能模块**: Agent Factory（Agent 创建、列表、详情、编辑）
- **需求来源**: `docs/product/workspaces/agent-factory.md`、`docs/technical/agents/agent-database-design.md`
- **测试覆盖**: Agent 列表查看、创建、详情查看、编辑、状态切换
- **最后更新**: 2026-05-27

---

## 1. 功能测试

### TC-F-AGENT-001: 查看 Agent 列表

- **需求**: Workspace 成员能够查看当前 Workspace 下的所有 Agent
- **优先级**: High
- **前置条件**:
  - 用户已登录
  - 用户属于该 Workspace
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
- **预期结果**:
  - 显示当前 Workspace 下所有 Agent 列表
  - 包含 Agent 名称、状态、操作按钮
  - 支持按状态筛选（全部/启用/禁用）
  - 支持按名称搜索

### TC-F-AGENT-002: 创建 Agent（成功）

- **需求**: Workspace 成员能够基于 Prototype 创建 Agent
- **优先级**: High
- **前置条件**:
  - 用户已登录且属于该 Workspace
  - 存在可用的 Agent Prototype
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 点击「新建 Agent」按钮
  3. 输入 Agent 名称：`测试客服助手`
  4. 选择 Prototype：选择某个原型
  5. 选择模型（可选）
  6. 输入描述：`用于测试的客服助手`
  7. 选择技能（可选）
  8. 点击「创建 Agent」按钮
- **预期结果**:
  - Agent 创建成功
  - 跳转至 Agent 详情页
  - Agent 状态为启用

### TC-F-AGENT-003: 查看 Agent 详情

- **需求**: 用户能够查看 Agent 详情
- **优先级**: High
- **前置条件**:
  - Agent 已创建
  - 用户有权访问该 Workspace
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 点击某个 Agent 的「详情」链接
- **预期结果**:
  - 跳转至 `/workspace/{workspace_code}/agents/{id}`
  - 显示 Agent 的完整信息（名称、描述、模型、状态、创建时间等）

### TC-F-AGENT-004: 编辑 Agent 配置

- **需求**: 用户能够编辑 Agent 配置
- **优先级**: High
- **前置条件**:
  - Agent 已创建
  - 用户有权访问该 Workspace
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 点击某个 Agent 的「编辑」链接
  3. 修改 Agent 名称或描述
  4. 点击「保存」按钮
- **预期结果**:
  - Agent 信息更新成功
  - 跳转回详情页
  - 显示更新后的信息

### TC-F-AGENT-005: 禁用 Agent

- **需求**: 用户能够禁用 Agent
- **优先级**: High
- **前置条件**:
  - Agent 状态为启用
  - 用户有权访问该 Workspace
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 找到状态为「启用」的 Agent
  3. 点击「禁用」按钮
- **预期结果**:
  - Agent 状态变更为「禁用」
  - 该 Agent 在列表中的「禁用」筛选下可见
  - 按钮变为「启用」

### TC-F-AGENT-006: 启用 Agent

- **需求**: 用户能够重新启用已禁用的 Agent
- **优先级**: High
- **前置条件**:
  - Agent 状态为禁用
  - 用户有权访问该 Workspace
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 在「禁用」筛选下找到该 Agent
  3. 点击「启用」按钮
- **预期结果**:
  - Agent 状态变更为「启用」
  - 该 Agent 在「启用」筛选下可见
  - 按钮变为「禁用」

### TC-F-AGENT-007: 按状态筛选 Agent

- **需求**: 用户能够按状态筛选 Agent 列表
- **优先级**: Medium
- **前置条件**: 存在启用和禁用状态的 Agent
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 点击「全部」按钮
  3. 点击「启用」按钮
  4. 点击「禁用」按钮
- **预期结果**:
  - 「全部」：显示所有 Agent
  - 「启用」：仅显示启用的 Agent
  - 「禁用」：仅显示禁用的 Agent

### TC-F-AGENT-008: 搜索 Agent

- **需求**: 用户能够按名称搜索 Agent
- **优先级**: Medium
- **前置条件**: 存在多个 Agent
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 在搜索框输入：`客服`
  3. 按回车或等待自动搜索
- **预期结果**:
  - 显示名称包含「客服」的 Agent
  - 支持模糊匹配

### TC-F-AGENT-009: 通过详情页编辑 Agent

- **需求**: 用户能够从详情页进入编辑页面
- **优先级**: Medium
- **前置条件**: Agent 已创建
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents/{id}`
  2. 点击「编辑」按钮
- **预期结果**:
  - 跳转至 `/workspace/{workspace_code}/agents/{id}/edit`
  - 表单预填充当前 Agent 信息

### TC-F-AGENT-010: 取消创建 Agent

- **需求**: 用户能够取消创建 Agent
- **优先级**: Low
- **前置条件**: 无
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents/create`
  2. 点击「取消」链接
- **预期结果**:
  - 返回至 Agent 列表页
  - 未创建 Agent

---

## 2. 边界测试

### TC-E-AGENT-001: 创建 Agent 时名称为空

- **需求**: Agent 名称为必填项
- **优先级**: High
- **前置条件**: 无
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents/create`
  2. 不输入名称
  3. 点击「创建 Agent」按钮
- **预期结果**:
  - 提示名称不能为空
  - 无法提交

### TC-E-AGENT-002: 创建 Agent 时未选择 Prototype

- **需求**: Prototype 为必选项
- **优先级**: High
- **前置条件**: 无
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents/create`
  2. 输入名称：`测试助手`
  3. 不选择 Prototype
  4. 点击「创建 Agent」按钮
- **预期结果**:
  - 提示请选择原型
  - 无法提交

### TC-E-AGENT-003: 创建 Agent 时名称过长

- **需求**: Agent 名称长度限制
- **优先级**: Medium
- **前置条件**: 无
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents/create`
  2. 输入超长的 Agent 名称
  3. 点击「创建 Agent」按钮
- **预期结果**:
  - 提示名称过长或格式不正确
  - 无法提交

### TC-E-AGENT-004: 编辑 Agent 时名称为空

- **需求**: Agent 名称不可为空
- **优先级**: High
- **前置条件**: Agent 已创建
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents/{id}/edit`
  2. 清空名称字段
  3. 点击「保存」按钮
- **预期结果**:
  - 提示名称不能为空
  - 保存失败

### TC-E-AGENT-005: 编辑不存在或无权限的 Agent

- **需求**: 无权访问时无法编辑 Agent
- **优先级**: High
- **前置条件**:
  - Agent 不存在或用户无权访问
- **测试步骤**:
  1. 直接访问 `/workspace/{workspace_code}/agents/99999/edit`
- **预期结果**:
  - 返回 401/403/404 错误
  - 或重定向至其他页面

### TC-E-AGENT-006: 查看其他 Workspace 的 Agent

- **需求**: 跨 Workspace 不可访问
- **优先级**: High
- **前置条件**:
  - 用户不属于某 Workspace
- **测试步骤**:
  1. 直接访问 `/workspace/other-workspace/agents`
- **预期结果**:
  - 返回 401/403 无权限错误
  - 或显示空列表

### TC-E-AGENT-007: 列表页无 Agent 时显示空状态

- **需求**: 无 Agent 时显示友好的空状态
- **优先级**: Low
- **前置条件**:
  - Workspace 下没有任何 Agent
- **测试步骤**:
  1. 访问新建 Workspace 的 Agent 列表页
- **预期结果**:
  - 显示空状态提示
  - 提供「新建 Agent」入口

### TC-E-AGENT-008: 搜索无匹配结果

- **需求**: 搜索无结果时显示提示
- **优先级**: Low
- **前置条件**: 无匹配 Agent 名称
- **测试步骤**:
  1. 访问 `/workspace/{workspace_code}/agents`
  2. 搜索不存在的名称
- **预期结果**:
  - 显示无搜索结果提示
  - 不崩溃

---

## 3. 错误处理测试

### TC-ERR-AGENT-001: 创建 Agent 时 API 调用失败

- **需求**: 创建失败时给出错误提示
- **优先级**: High
- **前置条件**:
  - 网络错误或服务端错误
- **测试步骤**:
  1. 访问创建页面
  2. 填写表单
  3. 模拟网络错误
  4. 点击「创建 Agent」按钮
- **预期结果**:
  - 显示错误提示
  - 不跳转页面
  - 数据未丢失

### TC-ERR-AGENT-002: 编辑 Agent 时 API 调用失败

- **需求**: 编辑失败时给出错误提示
- **优先级**: High
- **前置条件**:
  - 网络错误或服务端错误
- **测试步骤**:
  1. 访问编辑页面
  2. 修改信息
  3. 模拟网络错误
  4. 点击「保存」按钮
- **预期结果**:
  - 显示错误提示
  - 数据未丢失
  - 可重试

### TC-ERR-AGENT-003: 禁用/启用 Agent 时 API 调用失败

- **需求**: 状态切换失败时给出错误提示
- **优先级**: Medium
- **前置条件**:
  - 网络错误或服务端错误
- **测试步骤**:
  1. 访问 Agent 列表
  2. 点击「禁用/启用」按钮
  3. 模拟网络错误
- **预期结果**:
  - 显示错误提示
  - 状态保持不变

### TC-ERR-AGENT-004: 访问不存在的 Agent 详情

- **需求**: 不存在的 Agent 返回 404
- **优先级**: High
- **前置条件**: Agent ID 不存在
- **测试步骤**:
  1. 直接访问 `/workspace/{workspace_code}/agents/99999`
- **预期结果**:
  - 返回 404 Not Found
  - 显示友好的错误页面

---

## 4. 状态转换测试

### TC-ST-AGENT-001: Agent 状态机转换

- **需求**: 验证 Agent 状态机
- **优先级**: High
- **前置条件**: Agent 存在
- **测试步骤**:
  1. **创建**：创建 Agent 后检查状态为「启用」
  2. **启用 → 禁用**：点击「禁用」按钮
  3. **禁用 → 启用**：点击「启用」按钮
- **预期结果**:
  - 每个状态转换正确执行
  - 列表和按钮状态正确更新

---

## 测试覆盖率矩阵

| 需求 ID | 需求描述 | 测试用例 | 覆盖率 |
|---------|----------|----------|--------|
| REQ-AGENT-001 | 查看 Agent 列表 | TC-F-AGENT-001, TC-E-AGENT-007, TC-E-AGENT-008 | ✓ 完整 |
| REQ-AGENT-002 | 创建 Agent | TC-F-AGENT-002, TC-E-AGENT-001, TC-E-AGENT-002, TC-E-AGENT-003 | ✓ 完整 |
| REQ-AGENT-003 | 查看 Agent 详情 | TC-F-AGENT-003, TC-ERR-AGENT-004 | ✓ 完整 |
| REQ-AGENT-004 | 编辑 Agent | TC-F-AGENT-004, TC-F-AGENT-009, TC-E-AGENT-004, TC-E-AGENT-005 | ✓ 完整 |
| REQ-AGENT-005 | 禁用 Agent | TC-F-AGENT-005, TC-ST-AGENT-001 | ✓ 完整 |
| REQ-AGENT-006 | 启用 Agent | TC-F-AGENT-006, TC-ST-AGENT-001 | ✓ 完整 |
| REQ-AGENT-007 | 按状态筛选 | TC-F-AGENT-007 | ✓ 完整 |
| REQ-AGENT-008 | 搜索 Agent | TC-E-AGENT-008 | ✓ 完整 |
| REQ-AGENT-009 | 错误处理 | TC-ERR-AGENT-001, TC-ERR-AGENT-002, TC-ERR-AGENT-003 | ✓ 完整 |
| REQ-AGENT-010 | 权限控制 | TC-E-AGENT-006 | ✓ 完整 |

---

## 备注

- Agent Factory 是 Workspace 下的功能模块，需确保测试时使用正确的 Workspace
- Prototype 需要提前创建或使用系统预设的 Prototype
- 测试数据：需要准备至少 2-3 个不同状态的 Agent 用于测试
- 页面交互：创建和编辑页面的高级配置部分可按需测试
