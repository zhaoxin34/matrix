---
id: agent-prototype-test-cases
title: Agent Prototype 管理模块
sidebar_position: 25
author: Joky.Zhao
created: 2026-05-28
updated: 2026-05-28
version: 1.0.0
---

# Test Cases: Agent Prototype 管理模块

## 概述

- **功能模块**: Agent Prototype 管理（列表、新建、编辑、发布、回滚）
- **需求来源**: `docs/product/admin/agent-prototype-management.md`、`docs/product/agents/agent-prototype-design.md`
- **测试覆盖**: Prototype 列表、新建、详情、编辑、发布、回滚、状态切换
- **最后更新**: 2026-05-28

---

## 1. 功能测试

### TC-F-PROTO-001: 查看 Prototype 列表

- **需求**: 管理员能够查看所有 Agent Prototype
- **优先级**: High
- **前置条件**:
  - 用户已登录
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
- **预期结果**:
  - 显示所有 Prototype 列表
  - 包含 ID、名称、版本、状态、创建时间
  - 支持按状态筛选（全部/draft/enabled/disabled）
  - 支持按名称搜索
  - 右上角有「新建 Prototype」按钮

### TC-F-PROTO-002: 创建 Prototype（成功）

- **需求**: 管理员能够创建新的 Agent Prototype
- **优先级**: High
- **前置条件**:
  - 用户已登录
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
  2. 点击「新建 Prototype」按钮
  3. 输入 Prototype 名称：`测试客服原型`
  4. 输入 Prompts 内容（Markdown 格式）
  5. 点击「保存草稿」按钮
- **预期结果**:
  - Prototype 创建成功
  - 跳转至详情页
  - 状态为 draft，版本为 NULL
  - 显示创建成功提示

### TC-F-PROTO-003: 查看 Prototype 详情

- **需求**: 管理员能够查看 Prototype 详细信息
- **优先级**: High
- **前置条件**:
  - Prototype 已创建
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
  2. 点击某个 Prototype 的名称或「详情」链接
- **预期结果**:
  - 跳转至 `/admin/agent-prototype/{id}`
  - 显示完整信息：
    - ID、名称、版本、状态、创建时间
    - Prompts 内容预览
  - 包含「编辑」「发布」「历史」「禁用/启用」按钮
  - 状态标签正确显示（草稿/已启用/已禁用）

### TC-F-PROTO-004: 编辑 Prototype Prompts

- **需求**: 管理员能够编辑 Prototype 的 Prompts
- **优先级**: High
- **前置条件**:
  - Prototype 已创建（任意状态）
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 点击「编辑」按钮
  3. 跳转至 `/admin/agent-prototype/{id}/edit`
  4. 修改 Prompts 内容
  5. 点击「保存草稿」按钮
- **预期结果**:
  - 保存成功
  - Prompts 内容更新
  - 版本号不变（仅保存草稿）
  - 显示保存成功提示

### TC-F-PROTO-005: 发布 Prototype（新版本）

- **需求**: 管理员能够发布 Prototype 生成新版本
- **优先级**: High
- **前置条件**:
  - Prototype 已创建
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 编辑 Prompts 内容并保存草稿
  3. 点击「发布」按钮
  4. 弹出发布对话框，输入版本号和变更说明
  5. 点击「确认发布」
- **预期结果**:
  - 版本号自动递增
  - 状态变为 enabled
  - 创建版本历史记录
  - Prompts 内容快照保存
  - 显示发布成功提示
  - 对话框关闭

### TC-F-PROTO-006: 查看版本历史

- **需求**: 管理员能够查看 Prototype 的历史版本
- **优先级**: High
- **前置条件**:
  - Prototype 已发布（至少 1 个版本）
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 点击「历史」按钮
  3. 弹窗显示版本历史列表
- **预期结果**:
  - 弹窗显示所有历史版本
  - 包含版本号、发布时间、变更说明
  - 每个版本有「回滚」按钮
  - 最新版本标记为「当前版本」

### TC-F-PROTO-007: 回滚到指定版本

- **需求**: 管理员能够回滚到历史版本
- **优先级**: High
- **前置条件**:
  - Prototype 有历史版本（至少 2 个）
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 点击「历史」按钮
  3. 选择一个历史版本
  4. 点击「回滚」按钮
  5. 确认回滚操作
- **预期结果**:
  - Prompts 内容恢复为历史版本
  - 版本号更新为回滚的版本号
  - 创建新的回滚历史记录
  - 显示回滚成功提示
  - 弹窗关闭，详情页刷新

### TC-F-PROTO-008: 禁用 Prototype

- **需求**: 管理员能够禁用已发布的 Prototype
- **优先级**: High
- **前置条件**:
  - Prototype 状态为 enabled
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 状态为 enabled
  3. 点击「禁用」按钮
- **预期结果**:
  - 状态变更为 disabled
  - 按钮变为「启用」
  - 列表中该 Prototype 显示「已禁用」标签

### TC-F-PROTO-009: 启用 Prototype

- **需求**: 管理员能够重新启用已禁用的 Prototype
- **优先级**: High
- **前置条件**:
  - Prototype 状态为 disabled
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 状态为 disabled
  3. 点击「启用」按钮
- **预期结果**:
  - 状态变更为 enabled
  - 按钮变为「禁用」
  - 列表中该 Prototype 显示「已启用」标签

### TC-F-PROTO-010: 删除 Draft Prototype

- **需求**: 管理员能够删除草稿状态的 Prototype
- **优先级**: Medium
- **前置条件**:
  - Prototype 状态为 draft
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 状态为 draft
  3. 点击「删除」按钮
  4. 确认删除操作
- **预期结果**:
  - Prototype 删除成功
  - 跳转回列表页
  - 该 Prototype 不再显示

### TC-F-PROTO-011: 按状态筛选列表

- **需求**: 管理员能够按状态筛选 Prototype
- **优先级**: Medium
- **前置条件**:
  - 存在不同状态的 Prototype
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
  2. 点击状态筛选器
  3. 选择「草稿」
  4. 选择「已启用」
  5. 选择「已禁用」
  6. 选择「全部」
- **预期结果**:
  - 「草稿」：仅显示 draft 状态
  - 「已启用」：仅显示 enabled 状态
  - 「已禁用」：仅显示 disabled 状态
  - 「全部」：显示所有状态

### TC-F-PROTO-012: 搜索 Prototype

- **需求**: 管理员能够按名称搜索 Prototype
- **优先级**: Medium
- **前置条件**:
  - 存在多个 Prototype
  - 用户为管理员角色
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
  2. 在搜索框输入关键词
  3. 按回车或等待自动搜索
- **预期结果**:
  - 显示名称匹配的 Prototype
  - 支持模糊匹配

---

## 2. 边界测试

### TC-E-PROTO-001: 创建 Prototype 时名称为空

- **需求**: Prototype 名称为必填项
- **优先级**: High
- **前置条件**: 无
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
  2. 点击「新建 Prototype」
  3. 不输入名称，直接点击「保存草稿」
- **预期结果**:
  - 提示名称不能为空
  - 无法提交

### TC-E-PROTO-002: 创建 Prototype 时 Prompts 为空

- **需求**: Prompts 内容为必填项
- **优先级**: High
- **前置条件**: 无
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/new`
  2. 输入名称但不输入 Prompts
  3. 点击「保存草稿」
- **预期结果**:
  - 提示 Prompts 不能为空
  - 无法提交

### TC-E-PROTO-003: 发布时未填写变更说明

- **需求**: 变更说明为必填项
- **优先级**: High
- **前置条件**:
  - Prototype 已创建
- **测试步骤**:
  1. 编辑并保存 Prototype
  2. 点击「发布」按钮
  3. 不填写变更说明，直接点击「确认发布」
- **预期结果**:
  - 提示变更说明不能为空
  - 无法发布

### TC-E-PROTO-004: 删除已发布的 Prototype

- **需求**: 已发布的 Prototype 不可删除
- **优先级**: High
- **前置条件**:
  - Prototype 状态为 enabled 或 disabled
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 状态为 enabled
  3. 尝试点击「删除」按钮
- **预期结果**:
  - 删除按钮不存在或被禁用
  - 无法删除

### TC-E-PROTO-005: 回滚到当前版本

- **需求**: 不能回滚到当前版本
- **优先级**: Medium
- **前置条件**:
  - Prototype 有历史版本
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 点击「历史」按钮
  3. 选择当前版本
  4. 尝试点击「回滚」
- **预期结果**:
  - 当前版本无「回滚」按钮
  - 或提示已是当前版本

### TC-E-PROTO-006: 编辑非草稿状态 Prototype

- **需求**: 非草稿状态也能编辑，但需要先发布
- **优先级**: Low
- **前置条件**:
  - Prototype 状态为 enabled
- **测试步骤**:
  1. 访问 `/admin/agent-prototype/{id}`
  2. 点击「编辑」按钮
  3. 修改 Prompts
  4. 保存草稿
- **预期结果**:
  - 编辑成功
  - Prompts 保存为草稿
  - 需要发布才能更新版本

### TC-E-PROTO-007: 列表页无 Prototype 时显示空状态

- **需求**: 无 Prototype 时显示友好的空状态
- **优先级**: Low
- **前置条件**:
  - 系统中没有任何 Prototype
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
- **预期结果**:
  - 显示空状态提示
  - 提供「新建 Prototype」入口

### TC-E-PROTO-008: 搜索无匹配结果

- **需求**: 搜索无结果时显示提示
- **优先级**: Low
- **前置条件**: 无匹配名称
- **测试步骤**:
  1. 访问 `/admin/agent-prototype`
  2. 搜索不存在的名称
- **预期结果**:
  - 显示无搜索结果提示
  - 不崩溃

---

## 3. 错误处理测试

### TC-ERR-PROTO-001: 创建 Prototype 时 API 调用失败

- **需求**: 创建失败时给出错误提示
- **优先级**: High
- **前置条件**:
  - 网络错误或服务端错误
- **测试步骤**:
  1. 访问创建页面
  2. 填写表单
  3. 模拟网络错误
  4. 点击「保存草稿」
- **预期结果**:
  - 显示错误提示
  - 不跳转页面
  - 数据未丢失

### TC-ERR-PROTO-002: 编辑 Prototype 时 API 调用失败

- **需求**: 编辑失败时给出错误提示
- **优先级**: High
- **前置条件**:
  - 网络错误或服务端错误
- **测试步骤**:
  1. 访问编辑页面
  2. 修改 Prompts
  3. 模拟网络错误
  4. 点击「保存草稿」
- **预期结果**:
  - 显示错误提示
  - 数据未丢失
  - 可重试

### TC-ERR-PROTO-003: 发布 Prototype 时 API 调用失败

- **需求**: 发布失败时给出错误提示
- **优先级**: High
- **前置条件**:
  - 网络错误或服务端错误
- **测试步骤**:
  1. 编辑并保存 Prototype
  2. 点击「发布」按钮
  3. 填写变更说明
  4. 模拟网络错误
  5. 点击「确认发布」
- **预期结果**:
  - 显示错误提示
  - 发布对话框保持打开
  - 可重试

### TC-ERR-PROTO-004: 回滚 Prototype 时 API 调用失败

- **需求**: 回滚失败时给出错误提示
- **优先级**: High
- **前置条件**:
  - 网络错误或服务端错误
- **测试步骤**:
  1. 访问详情页
  2. 点击「历史」按钮
  3. 选择历史版本
  4. 模拟网络错误
  5. 点击「回滚」
- **预期结果**:
  - 显示错误提示
  - 当前状态保持不变

### TC-ERR-PROTO-005: 访问不存在的 Prototype 详情

- **需求**: 不存在的 Prototype 返回 404
- **优先级**: High
- **前置条件**: Prototype ID 不存在
- **测试步骤**:
  1. 直接访问 `/admin/agent-prototype/99999`
- **预期结果**:
  - 返回 404 Not Found
  - 显示友好的错误页面

---

## 4. 状态转换测试

### TC-ST-PROTO-001: Prototype 完整状态机转换

- **需求**: 验证 Prototype 状态机
- **优先级**: High
- **前置条件**: 无
- **测试步骤**:
  1. **创建**：创建 Prototype，检查状态为 draft
  2. **发布**：点击「发布」，检查状态变为 enabled
  3. **编辑+发布**：编辑 Prompts → 保存草稿 → 发布，检查版本递增
  4. **禁用**：点击「禁用」，检查状态变为 disabled
  5. **启用**：点击「启用」，检查状态变为 enabled
  6. **回滚**：打开历史 → 选择历史版本 → 回滚，检查内容恢复
- **预期结果**:
  - 每个状态转换正确执行
  - 版本号正确递增/更新
  - Prompts 内容正确保存/恢复

---

## 5. 权限测试

### TC-PERM-PROTO-001: 非管理员不能访问 Prototype 管理页面

- **需求**: 只有管理员能访问管理功能
- **优先级**: High
- **前置条件**:
  - 用户为普通用户（非管理员）
- **测试步骤**:
  1. 直接访问 `/admin/agent-prototype`
- **预期结果**:
  - 返回 401/403 无权限错误
  - 或重定向至其他页面

### TC-PERM-PROTO-002: 非管理员不能创建 Prototype

- **需求**: 只有管理员能创建
- **优先级**: High
- **前置条件**:
  - 用户为普通用户（非管理员）
- **测试步骤**:
  1. 直接访问 `/admin/agent-prototype/new`
- **预期结果**:
  - 返回 401/403 无权限错误

### TC-PERM-PROTO-003: 非管理员不能发布/回滚 Prototype

- **需求**: 只有管理员能发布和回滚
- **优先级**: High
- **前置条件**:
  - 用户为普通用户（非管理员）
- **测试步骤**:
  1. 尝试直接调用发布/回滚 API
- **预期结果**:
  - 返回 401/403 无权限错误

---

## 测试覆盖率矩阵

| 需求 ID | 需求描述 | 测试用例 | 覆盖率 |
|---------|----------|----------|--------|
| REQ-PROTO-001 | 查看 Prototype 列表 | TC-F-PROTO-001, TC-E-PROTO-007, TC-E-PROTO-008 | ✓ 完整 |
| REQ-PROTO-002 | 创建 Prototype | TC-F-PROTO-002, TC-E-PROTO-001, TC-E-PROTO-002 | ✓ 完整 |
| REQ-PROTO-003 | 查看 Prototype 详情 | TC-F-PROTO-003, TC-ERR-PROTO-005 | ✓ 完整 |
| REQ-PROTO-004 | 编辑 Prototype | TC-F-PROTO-004, TC-E-PROTO-006, TC-ERR-PROTO-002 | ✓ 完整 |
| REQ-PROTO-005 | 发布 Prototype | TC-F-PROTO-005, TC-E-PROTO-003, TC-ERR-PROTO-003 | ✓ 完整 |
| REQ-PROTO-006 | 查看版本历史 | TC-F-PROTO-006 | ✓ 完整 |
| REQ-PROTO-007 | 回滚到历史版本 | TC-F-PROTO-007, TC-E-PROTO-005, TC-ERR-PROTO-004 | ✓ 完整 |
| REQ-PROTO-008 | 禁用 Prototype | TC-F-PROTO-008, TC-ST-PROTO-001 | ✓ 完整 |
| REQ-PROTO-009 | 启用 Prototype | TC-F-PROTO-009, TC-ST-PROTO-001 | ✓ 完整 |
| REQ-PROTO-010 | 删除 Prototype | TC-F-PROTO-010, TC-E-PROTO-004 | ✓ 完整 |
| REQ-PROTO-011 | 按状态筛选 | TC-F-PROTO-011 | ✓ 完整 |
| REQ-PROTO-012 | 搜索 Prototype | TC-F-PROTO-012 | ✓ 完整 |
| REQ-PROTO-013 | 权限控制 | TC-PERM-PROTO-001, TC-PERM-PROTO-002, TC-PERM-PROTO-003 | ✓ 完整 |
| REQ-PROTO-014 | 状态机验证 | TC-ST-PROTO-001 | ✓ 完整 |

---

## 备注

- Agent Prototype 是管理员功能，需确保测试时使用管理员账号
- 测试数据准备：
  - 至少 1 个 draft 状态 Prototype
  - 至少 1 个 enabled 状态 Prototype（含历史版本）
  - 至少 1 个 disabled 状态 Prototype
- 发布约束：版本号自动递增，变更说明必填
- 回滚特性：回滚是复制操作，不删除目标版本
- 删除约束：仅 draft 状态可删除