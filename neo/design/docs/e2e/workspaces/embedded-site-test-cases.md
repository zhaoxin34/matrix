---
id: embedded-site-test-cases
title: 嵌入网站管理 - E2E 测试用例
sidebar_position: 60
author: Joky.Zhao
created: 2026-05-29
updated: 2026-05-29
version: 1.0.0
tags: [E2E, Workspace, Embedded-Site]
---

# 嵌入网站管理 - E2E 测试用例

## Overview

- **Feature**: 嵌入网站管理 (Embedded Site)
- **Requirements Source**: 
  - [产品设计文档](../../product/workspaces/embedded-site)
  - [技术设计文档](../../technical/workspaces/embedded-site)
- **Test Coverage**: 
  - 功能测试：CRUD 操作
  - 边界测试：字段长度、格式验证
  - 错误测试：必填项、唯一性约束
  - 状态测试：启用/禁用状态流转
  - UI 测试：搜索、筛选、分页
- **Last Updated**: 2026-05-29

---

## 测试数据准备

### 测试账号

| 账号 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 测试用户 | 13800138002 | abcd1234 | 有 workspace 访问权限 |

### 测试数据

| 数据类型 | 值 | 说明 |
|----------|-----|------|
| workspace_code | `demo` | 测试用 workspace code |
| site_name | `测试网站` | 有效网站名称 |
| site_url | `https://example.com` | 有效网站地址 |

---

## 测试用例分类

### 1. 功能测试 (Functional Tests)

#### TC-F-001: 访问嵌入网站列表页

- **Requirement**: 用户可以访问并查看嵌入网站列表
- **Priority**: High
- **Preconditions**:
  - 用户已登录系统
  - 存在至少一个 workspace
- **Test Steps**:
  1. 导航到 `/workspace/{workspace_code}/embedded-sites`
  2. 等待页面加载完成
- **Expected Results**:
  - 页面标题显示 "嵌入网站" 或 "Embedded Sites"
  - 显示搜索框和状态筛选器
  - 显示创建按钮
  - 如果有数据，显示网站卡片列表
  - 如果无数据，显示空状态提示
- **Postconditions**: 页面正常加载，无错误提示

---

#### TC-F-002: 创建嵌入网站 - 必填字段

- **Requirement**: 用户可以创建新的嵌入网站
- **Priority**: High
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击列表页的 "创建" 按钮
  2. 在弹出的对话框中填写表单：
     - 网站名称: `测试网站-001`
     - 网站地址: `https://test.example.com`
     - 网站描述: `这是一个测试网站`
     - 启用状态: 默认开启
  3. 点击 "创建" 按钮
- **Expected Results**:
  - 对话框关闭
  - 显示成功提示 "嵌入网站创建成功"
  - 列表中新增一条记录
  - 新记录包含正确的网站名称、网站地址
- **Postconditions**: 新网站已创建，状态为启用

---

#### TC-F-003: 创建嵌入网站 - 可选字段

- **Requirement**: 创建时可以只填必填字段
- **Priority**: Medium
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击列表页的 "创建" 按钮
  2. 在弹出的对话框中只填写必填字段：
     - 网站名称: `最小测试网站`
     - 网站地址: `https://minimal.example.com`
     - 网站描述: 留空
  3. 点击 "创建" 按钮
- **Expected Results**:
  - 创建成功
  - 新记录 description 字段为空或 null
- **Postconditions**: 新网站已创建

---

#### TC-F-004: 编辑嵌入网站

- **Requirement**: 用户可以编辑已有的嵌入网站
- **Priority**: High
- **Preconditions**:
  - 存在一条已创建的嵌入网站记录
- **Test Steps**:
  1. 在列表中找到要编辑的网站
  2. 点击操作区域的 "编辑" 按钮
  3. 修改表单字段：
     - 网站名称: `修改后的网站名称`
     - 网站地址: `https://updated.example.com`
  4. 点击 "保存" 按钮
- **Expected Results**:
  - 页面跳转到列表页
  - 显示成功提示 "嵌入网站保存成功"
  - 列表中该记录已更新
- **Postconditions**: 网站信息已更新

---

#### TC-F-005: 启用嵌入网站

- **Requirement**: 用户可以将禁用的网站启用
- **Priority**: High
- **Preconditions**:
  - 存在一条状态为 "禁用" 的嵌入网站
- **Test Steps**:
  1. 在列表中找到状态为 "禁用" 的网站
  2. 点击状态开关切换为启用
  3. 等待状态更新
- **Expected Results**:
  - 网站状态变为 "启用"
  - UI 显示正确的状态标签（绿色/启用）
- **Postconditions**: 网站状态为启用

---

#### TC-F-006: 禁用嵌入网站

- **Requirement**: 用户可以将启用的网站禁用
- **Priority**: High
- **Preconditions**:
  - 存在一条状态为 "启用" 的嵌入网站
- **Test Steps**:
  1. 在列表中找到状态为 "启用" 的网站
  2. 点击状态开关切换为禁用
  3. 等待状态更新
- **Expected Results**:
  - 网站状态变为 "禁用"
  - UI 显示正确的状态标签（灰色/禁用）
- **Postconditions**: 网站状态为禁用

---

#### TC-F-007: 搜索网站

- **Requirement**: 用户可以通过关键词搜索嵌入网站
- **Priority**: Medium
- **Preconditions**:
  - 存在多条嵌入网站记录，包括：
    - `测试网站-A`
    - `正式网站-B`
    - `测试网站-C`
- **Test Steps**:
  1. 在搜索框中输入 "测试网站"
  2. 等待搜索结果
- **Expected Results**:
  - 显示匹配 "测试网站" 的记录（A 和 C）
  - 不显示不匹配 "测试网站" 的记录（B）
  - 列表上方显示匹配数量 "共 2 个嵌入网站"
- **Postconditions**: 搜索结果正确

---

#### TC-F-008: 按状态筛选

- **Requirement**: 用户可以按状态筛选嵌入网站
- **Priority**: Medium
- **Preconditions**:
  - 存在多条不同状态的嵌入网站记录
- **Test Steps**:
  1. 点击状态筛选器
  2. 选择 "启用" 状态
  3. 等待筛选结果
- **Expected Results**:
  - 只显示状态为 "启用" 的记录
  - 不显示状态为 "禁用" 的记录
- **Postconditions**: 筛选结果正确

---

#### TC-F-009: 取消创建

- **Requirement**: 用户可以取消创建操作
- **Priority**: Low
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击列表页的 "创建" 按钮
  2. 在弹出的对话框中填写表单
  3. 点击 "取消" 按钮
- **Expected Results**:
  - 对话框关闭
  - 数据未被保存
  - 列表无变化
- **Postconditions**: 无新增记录

---

### 2. 边界测试 (Edge Case Tests)

#### TC-E-001: 网站名称 - 最大长度边界

- **Requirement**: 网站名称最大 255 字符
- **Priority**: High
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 网站名称输入 255 个字符（如 "测试网站" 重复）
  3. 填写有效的网站地址
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 创建成功
  - 列表显示该网站
- **Postconditions**: 网站名称为 255 字符

---

#### TC-E-002: 网站名称 - 超出最大长度

- **Requirement**: 网站名称超过 255 字符应被拒绝
- **Priority**: High
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 网站名称输入 256 个字符
  3. 填写有效的网站地址
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "名称不能超过255个字符"
  - 创建失败
- **Postconditions**: 无新增记录

---

#### TC-E-003: 网站描述 - 最大长度边界

- **Requirement**: 网站描述最大 5000 字符
- **Priority**: Medium
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 填写有效的网站名称和地址
  3. 描述输入 5000 个字符
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 创建成功
- **Postconditions**: 网站描述为 5000 字符

---

#### TC-E-004: 网站描述 - 超出最大长度

- **Requirement**: 网站描述超过 5000 字符应被拒绝
- **Priority**: Medium
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 填写有效的网站名称和地址
  3. 描述输入 5001 个字符
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "描述不能超过5000个字符"
  - 创建失败
- **Postconditions**: 无新增记录

---

#### TC-E-005: URL - http 协议

- **Requirement**: 支持 http 协议的网站地址
- **Priority**: Medium
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 填写网站名称
  3. 网站地址输入 `http://example.com`（非 https）
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 创建成功
- **Postconditions**: 网站使用 http 协议

---

#### TC-E-006: URL - 无协议前缀

- **Requirement**: 无协议前缀的 URL 应被拒绝
- **Priority**: High
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 填写网站名称
  3. 网站地址输入 `example.com`（无 http:// 或 https://）
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "请输入有效的URL地址"
  - 创建失败
- **Postconditions**: 无新增记录

---

#### TC-E-007: URL - 无效格式

- **Requirement**: 无效 URL 格式应被拒绝
- **Priority**: High
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 填写网站名称
  3. 网站地址输入以下无效值之一：
     - `not a url`
     - `ftp://example.com`
     - `javascript:alert(1)`
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "请输入有效的URL地址"
  - 创建失败
- **Postconditions**: 无新增记录

---

#### TC-E-008: 搜索 - 空搜索词

- **Requirement**: 空搜索词应显示所有记录
- **Priority**: Low
- **Preconditions**:
  - 存在多条嵌入网站记录
- **Test Steps**:
  1. 在搜索框中清空内容
  2. 等待搜索结果
- **Expected Results**:
  - 显示所有记录
- **Postconditions**: 显示完整列表

---

### 3. 错误处理测试 (Error Handling Tests)

#### TC-ERR-001: 网站名称 - 空值

- **Requirement**: 网站名称为必填字段
- **Priority**: High
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 清空网站名称
  3. 填写有效的网站地址
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "请输入网站名称"
  - 创建失败
  - 对话框保持打开状态
- **Postconditions**: 无新增记录

---

#### TC-ERR-002: 网站地址 - 空值

- **Requirement**: 网站地址为必填字段
- **Priority**: High
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 填写网站名称
  3. 清空网站地址
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "请输入网站地址"
  - 创建失败
  - 对话框保持打开状态
- **Postconditions**: 无新增记录

---

#### TC-ERR-003: 网站名称 - 全空格

- **Requirement**: 全空格名称应被拒绝
- **Priority**: Medium
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 网站名称输入多个空格 "    "
  3. 填写有效的网站地址
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "请输入网站名称"
  - 创建失败
- **Postconditions**: 无新增记录

---

#### TC-ERR-004: 网站名称 - 重复

- **Requirement**: 同一 Workspace 下网站名称必须唯一
- **Priority**: High
- **Preconditions**:
  - 存在名称为 `重复网站` 的嵌入网站
- **Test Steps**:
  1. 点击 "创建" 按钮
  2. 网站名称输入 `重复网站`
  3. 填写有效的网站地址
  4. 点击 "创建" 按钮
- **Expected Results**:
  - 显示错误提示 "网站名称已存在" 或类似的重复错误信息
  - 创建失败
- **Postconditions**: 无新增记录（名称仍为 `重复网站`）

---

#### TC-ERR-005: 编辑 - 网站不存在

- **Requirement**: 编辑不存在的网站应返回 404
- **Priority**: Medium
- **Preconditions**:
  - 已知一个不存在的网站 ID
- **Test Steps**:
  1. 直接访问 `/workspace/{workspace_code}/embedded-sites/99999/edit`
- **Expected Results**:
  - 返回 404 页面或错误提示
- **Postconditions**: 页面显示 404 错误

---

### 4. 状态流转测试 (State Transition Tests)

#### TC-ST-001: 创建后默认状态

- **Requirement**: 新创建的嵌入网站状态为禁用
- **Priority**: Medium
- **Preconditions**:
  - 无
- **Test Steps**:
  1. 创建一个新的嵌入网站（不启用）
  2. 查看创建后的状态
- **Expected Results**:
  - 根据业务需求：新网站可能是 disabled 或 enabled
  - 状态与设计文档一致
- **Postconditions**: 状态正确

---

#### TC-ST-002: 状态切换 - 多次启用禁用

- **Requirement**: 状态可以多次切换
- **Priority**: Low
- **Preconditions**:
  - 存在一条嵌入网站记录
- **Test Steps**:
  1. 记录当前状态（假设为 enabled）
  2. 点击开关禁用 → 状态变为 disabled
  3. 点击开关启用 → 状态变为 enabled
  4. 点击开关禁用 → 状态变为 disabled
- **Expected Results**:
  - 每次切换后状态正确更新
  - 无状态混乱或数据丢失
- **Postconditions**: 最终状态为 disabled

---

### 5. UI 交互测试 (UI Interaction Tests)

#### TC-UI-001: 创建对话框 - 表单验证

- **Requirement**: 表单应实时验证输入
- **Priority**: Medium
- **Preconditions**:
  - 用户已登录并有 workspace 访问权限
- **Test Steps**:
  1. 点击 "创建" 按钮打开对话框
  2. 输入无效的网站名称（超长）
  3. 观察实时验证反馈
- **Expected Results**:
  - 输入框下方显示错误提示
  - 错误提示实时更新
  - 创建按钮仍可点击但会显示完整错误
- **Postconditions**: 无新增记录

---

#### TC-UI-002: 列表 - 空状态显示

- **Requirement**: 空列表应显示友好提示
- **Priority**: Medium
- **Preconditions**:
  - Workspace 下没有任何嵌入网站
- **Test Steps**:
  1. 进入一个空的 Workspace 的嵌入网站列表
- **Expected Results**:
  - 显示空状态图标（如文件夹图标）
  - 显示提示文案 "暂无嵌入网站"
  - 显示 "创建嵌入网站" 按钮
- **Postconditions**: 空状态显示正确

---

#### TC-UI-003: 卡片 - 信息展示

- **Requirement**: 列表卡片应正确展示网站信息
- **Priority**: High
- **Preconditions**:
  - 存在至少一条嵌入网站记录
- **Test Steps**:
  1. 查看列表中的网站卡片
- **Expected Results**:
  - 显示网站名称
  - 显示网站地址
  - 显示网站描述（如有）
  - 显示状态标签（启用/禁用）
  - 显示创建时间
  - 显示操作按钮（编辑、删除）
- **Postconditions**: 信息展示完整

---

## 测试覆盖率矩阵

| 需求 ID | 需求描述 | 测试用例 | 覆盖率 |
|---------|----------|----------|--------|
| REQ-001 | 查看嵌入网站列表 | TC-F-001 | ✓ Complete |
| REQ-002 | 创建嵌入网站 | TC-F-002, TC-F-003 | ✓ Complete |
| REQ-003 | 编辑嵌入网站 | TC-F-004 | ✓ Complete |
| REQ-004 | 删除嵌入网站 | TC-ERR-004 (验证逻辑) | ⚠ Partial |
| REQ-005 | 启用/禁用切换 | TC-F-005, TC-F-006, TC-ST-002 | ✓ Complete |
| REQ-006 | 搜索功能 | TC-F-007, TC-E-008 | ✓ Complete |
| REQ-007 | 状态筛选 | TC-F-008 | ✓ Complete |
| REQ-008 | 表单验证 | TC-ERR-001~003, TC-E-001~007 | ✓ Complete |
| REQ-009 | 名称唯一性 | TC-ERR-004 | ✓ Complete |
| REQ-010 | URL 格式验证 | TC-E-005~007 | ✓ Complete |

---

## 手动测试执行清单

### 测试前准备

- [ ] 准备测试账号 (13800138002 / abcd1234)
- [ ] 确认测试 Workspace 存在 (demo)
- [ ] 清理测试数据（如需要）

### 执行顺序

1. **功能测试** (按优先级执行)
   - [ ] TC-F-001: 访问列表页
   - [ ] TC-F-002: 创建 - 必填字段
   - [ ] TC-F-003: 创建 - 可选字段
   - [ ] TC-F-004: 编辑
   - [ ] TC-F-005: 启用
   - [ ] TC-F-006: 禁用
   - [ ] TC-F-007: 搜索
   - [ ] TC-F-008: 状态筛选

2. **边界测试**
   - [ ] TC-E-001~007

3. **错误处理测试**
   - [ ] TC-ERR-001~005

4. **状态流转测试**
   - [ ] TC-ST-001~002

5. **UI 交互测试**
   - [ ] TC-UI-001~003

### 测试后清理

- [ ] 删除测试创建的嵌入网站
- [ ] 记录发现的 Bug

---

## 已知限制

1. **前端 Mock 数据**: 当前 UI 使用 Mock 数据，后端 API 尚未完全实现
2. **删除功能**: 产品文档中未详细描述删除功能的 UI，后续需补充
3. **Agent 关联检查**: 删除前检查是否有关联 Agent 的逻辑需后端实现

---

## 相关文档

- [嵌入网站管理 - 产品设计](../../product/workspaces/embedded-site)
- [嵌入网站管理 - 技术设计](../../technical/workspaces/embedded-site)
- [路由表设计](../../product/overview/routing-table)