---
title: Test Cases: Workspace 管理模块
---

- **功能模块**: Workspace 管理（创建、编辑、禁用、成员管理）
- **需求来源**: `docs/product/base/workspace设计.md`、`docs/technical/admin/workspace技术设计.md`
- **测试覆盖**: Workspace 创建、列表查看、设置编辑、状态切换、成员管理、审计日志
- **最后更新**: 2026-05-27

---

## 1. 功能测试

### TC-F-WS-001: 创建 Workspace（成功）

- **需求**: 系统管理员能够创建新的 Workspace
- **优先级**: High
- **前置条件**:
  - 当前用户具有「创建 Workspace」权限
  - 存在可关联的组织
- **测试步骤**:
  1. 访问工作区管理页面 `/admin/workspace`
  2. 点击「新建工作区」按钮
  3. 输入工作区名称：`测试工作区`
  4. （可选）输入描述：`这是一个测试工作区`
  5. 点击「创建」按钮
- **预期结果**:
  - Workspace 创建成功
  - 自动生成唯一 code（如 `ceshi-gongzuoqu`）
  - 当前用户自动成为该 Workspace 的所有者
  - Workspace 状态为 `active`
  - 跳转至新 Workspace 的概览页或设置页

### TC-F-WS-002: 查看 Workspace 列表（管理员视角）

- **需求**: 系统管理员能够查看所有 Workspace
- **优先级**: High
- **前置条件**: 已以管理员身份登录
- **测试步骤**:
  1. 访问 `/admin/workspace`
- **预期结果**:
  - 显示所有 Workspace 列表
  - 包含名称、code、状态、成员数、项目数等信息
  - 支持分页展示

### TC-F-WS-003: 按状态筛选 Workspace

- **需求**: 管理员能够按状态筛选 Workspace
- **优先级**: Medium
- **前置条件**: 存在 active 和 disabled 状态的 Workspace
- **测试步骤**:
  1. 访问 `/admin/workspace`
  2. 点击「全部」按钮
  3. 点击「活跃」按钮
  4. 点击「已禁用」按钮
- **预期结果**:
  - 点击「全部」：显示所有 Workspace
  - 点击「活跃」：仅显示 status=active 的 Workspace
  - 点击「已禁用」：仅显示 status=disabled 的 Workspace

### TC-F-WS-004: 搜索 Workspace

- **需求**: 管理员能够按名称搜索 Workspace
- **优先级**: Medium
- **前置条件**: 存在多个 Workspace
- **测试步骤**:
  1. 访问 `/admin/workspace`
  2. 在搜索框输入：`测试`
  3. 按回车或等待自动搜索
- **预期结果**:
  - 显示名称包含「测试」的 Workspace
  - 支持模糊匹配

### TC-F-WS-005: 查看 Workspace 详情

- **需求**: 管理员能够查看 Workspace 详情
- **优先级**: High
- **前置条件**: Workspace 存在
- **测试步骤**:
  1. 访问 `/admin/workspace`
  2. 点击某个 Workspace 列表项
- **预期结果**:
  - 跳转至 Workspace 设置页面 `/admin/workspace/{id}/settings`
  - 显示基本信息（名称、code、描述、创建时间）
  - 显示所有者信息
  - 显示成员列表

### TC-F-WS-006: 编辑 Workspace 基本信息

- **需求**: Workspace 所有者能够编辑 Workspace 基本信息
- **优先级**: High
- **前置条件**:
  - 用户为该 Workspace 的所有者或有编辑权限
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 编辑名称：`测试工作区-更新`
  3. 编辑描述：`更新后的描述信息`
  4. 点击「保存」按钮
- **预期结果**:
  - Workspace 信息更新成功
  - 变更记录写入审计日志
  - 页面显示更新后的信息

### TC-F-WS-007: 禁用 Workspace

- **需求**: Workspace 所有者能够禁用 Workspace
- **优先级**: High
- **前置条件**:
  - 用户为该 Workspace 的所有者
  - Workspace 状态为 active
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 进入「高级设置」或类似区域
  3. 点击「禁用工作区」按钮
  4. 在弹出的确认对话框中确认操作
- **预期结果**:
  - Workspace 状态变更为 `disabled`
  - 所有成员无法访问该 Workspace
  - 数据完整保留
  - 禁用记录写入审计日志

### TC-F-WS-008: 启用 Workspace

- **需求**: Workspace 所有者能够重新启用已禁用的 Workspace
- **优先级**: High
- **前置条件**:
  - 用户为该 Workspace 的所有者
  - Workspace 状态为 disabled
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 点击「启用工作区」按钮
  3. 确认操作
- **预期结果**:
  - Workspace 状态变更为 `active`
  - 成员恢复访问权限

### TC-F-WS-009: 添加 Workspace 成员

- **需求**: Workspace 所有者能够添加成员
- **优先级**: High
- **前置条件**:
  - 用户为该 Workspace 的所有者
  - 存在可添加的全局用户
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 进入「成员管理」区域
  3. 点击「邀请成员」或「添加成员」按钮
  4. 搜索用户
  5. 选择用户并分配角色（管理员/成员/访客）
  6. 确认添加
- **预期结果**:
  - 成员成功添加至 Workspace
  - 成员获得相应角色的访问权限
  - 成员列表更新

### TC-F-WS-010: 移除 Workspace 成员

- **需求**: Workspace 所有者能够移除成员
- **优先级**: High
- **前置条件**:
  - 用户为该 Workspace 的所有者
  - Workspace 中存在可移除的成员
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 进入「成员管理」区域
  3. 找到要移除的成员
  4. 点击「移除」按钮
  5. 确认操作
- **预期结果**:
  - 成员从 Workspace 中移除
  - 成员失去该 Workspace 的访问权限
  - 不影响该用户的全局身份

### TC-F-WS-011: 查看「我的 Workspace」（用户视角）

- **需求**: 普通用户能够查看可访问的 Workspace 列表
- **优先级**: High
- **前置条件**: 用户已登录且属于某个 Workspace
- **测试步骤**:
  1. 访问 `/workspace`
- **预期结果**:
  - 显示当前用户可访问的 Workspace 列表
  - 仅显示用户作为成员或所有者的 Workspace

### TC-F-WS-012: 查看 Workspace 详情（用户视角）

- **需求**: 普通用户能够查看 Workspace 详情
- **优先级**: High
- **前置条件**: 用户有权访问该 Workspace
- **测试步骤**:
  1. 访问 `/workspace`
  2. 点击某个 Workspace
- **预期结果**:
  - 跳转至 Workspace 详情页 `/workspace/{id}`
  - 显示 Workspace 概览信息

---

## 2. 边界测试

### TC-E-WS-001: 创建 Workspace 时名称为空

- **需求**: Workspace 名称为必填项
- **优先级**: High
- **前置条件**: 当前用户具有创建权限
- **测试步骤**:
  1. 访问 `/admin/workspace/new`
  2. 不输入名称，直接点击「创建」按钮
- **预期结果**:
  - 返回错误码 `1001`（Invalid Parameter）
  - 提示名称不能为空

### TC-E-WS-002: 创建 Workspace 时名称超长

- **需求**: Workspace 名称限制 1-50 字符
- **优先级**: High
- **前置条件**: 当前用户具有创建权限
- **测试步骤**:
  1. 访问 `/admin/workspace/new`
  2. 输入长度超过 50 的名称
  3. 点击「创建」按钮
- **预期结果**:
  - 返回错误码 `1001`（Invalid Parameter）
  - 提示名称过长

### TC-E-WS-003: 创建 Workspace 时名称已存在

- **需求**: Workspace 名称在同一组织下唯一
- **优先级**: High
- **前置条件**:
  - 当前用户具有创建权限
  - 存在同名 Workspace
- **测试步骤**:
  1. 访问 `/admin/workspace/new`
  2. 输入已存在的 Workspace 名称
  3. 点击「创建」按钮
- **预期结果**:
  - 返回错误码 `3001`（Name Conflict）
  - 提示该名称已存在

### TC-E-WS-004: 编辑 Workspace 时名称为空

- **需求**: Workspace 名称不可为空
- **优先级**: High
- **前置条件**: 用户为 Workspace 所有者
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 清空名称字段
  3. 点击「保存」按钮
- **预期结果**:
  - 返回错误码 `1001`
  - 提示名称不能为空

### TC-E-WS-005: 尝试编辑 Workspace code

- **需求**: Workspace code 不可编辑
- **优先级**: Medium
- **前置条件**: 用户为 Workspace 所有者
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 尝试修改 code 字段
- **预期结果**:
  - code 字段为只读状态
  - 无法修改

### TC-E-WS-006: 尝试修改所有者

- **需求**: 通过普通编辑无法修改所有者
- **优先级**: Medium
- **前置条件**: 用户为 Workspace 所有者
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 在基本信息区域尝试修改 owner_id
- **预期结果**:
  - owner_id 字段为只读或不可见
  - 如需修改需通过「转移所有权」专用接口

### TC-E-WS-007: 禁用已禁用的 Workspace

- **需求**: 已禁用的 Workspace 不可再次禁用
- **优先级**: Medium
- **前置条件**: Workspace 状态为 disabled
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 点击「禁用工作区」按钮
- **预期结果**:
  - 按钮不可点击或无反应
  - 或提示 Workspace 已禁用

### TC-E-WS-008: 无创建权限时访问创建页

- **需求**: 无创建权限的用户不可访问创建页面
- **优先级**: High
- **前置条件**:
  - 当前用户不具备「创建 Workspace」权限
- **测试步骤**:
  1. 直接访问 `/admin/workspace/new`
- **预期结果**:
  - 返回 401/403 无权限错误
  - 或页面重定向至其他页面

### TC-E-WS-009: 添加不存在的用户为成员

- **需求**: 只能搜索已注册的全域用户
- **优先级**: Medium
- **前置条件**: 用户为 Workspace 所有者
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 进入「成员管理」
  3. 搜索一个不存在的手机号/用户名
- **预期结果**:
  - 提示未找到该用户
  - 无法添加

### TC-E-WS-010: 成员数量超过显示上限

- **需求**: 成员列表支持分页
- **优先级**: Low
- **前置条件**: Workspace 成员数量超过分页上限（如 100 个）
- **测试步骤**:
  1. 访问 `/admin/workspace/{id}/settings`
  2. 查看成员列表
- **预期结果**:
  - 成员列表分页展示
  - 可翻页查看所有成员

---

## 3. 错误处理测试

### TC-ERR-WS-001: 编辑不存在的 Workspace

- **需求**: 编辑不存在的 Workspace 时给出错误提示
- **优先级**: High
- **前置条件**: Workspace ID 不存在
- **测试步骤**:
  1. 直接访问 `/admin/workspace/99999/settings`
- **预期结果**:
  - 返回 404 Not Found
  - 提示 Workspace 不存在

### TC-ERR-WS-002: 无权访问 Workspace 设置

- **需求**: 非所有者或管理员无法编辑 Workspace
- **优先级**: High
- **前置条件**:
  - 当前用户不是该 Workspace 的所有者
  - 当前用户不是超级管理员
- **测试步骤**:
  1. 直接访问 `/admin/workspace/{id}/settings`
- **预期结果**:
  - 返回 401/403 无权限错误
  - 或重定向至其他页面

### TC-ERR-WS-003: 创建 Workspace 时无组织

- **需求**: Workspace 必须关联组织
- **优先级**: High
- **前置条件**: 无法关联任何组织
- **测试步骤**:
  1. 访问 `/admin/workspace/new`
  2. 输入名称
  3. 尝试提交
- **预期结果**:
  - 返回错误码 `1001`
  - 提示需要选择组织或无可用组织

### TC-ERR-WS-004: 禁用时 API 调用失败

- **需求**: 禁用失败时给出错误提示并回滚
- **优先级**: Medium
- **前置条件**:
  - Workspace 状态为 active
  - 网络或服务端错误
- **测试步骤**:
  1. 访问 Workspace 设置页
  2. 点击「禁用工作区」
  3. 模拟网络错误
- **预期结果**:
  - 显示错误提示
  - Workspace 状态保持不变

---

## 4. 状态转换测试

### TC-ST-WS-001: Workspace 状态机转换

- **需求**: 验证 Workspace 状态机
- **优先级**: High
- **前置条件**: Workspace 存在且状态为 active
- **测试步骤**:
  1. **创建中 → active**：创建 Workspace 后检查状态
  2. **active → disabled**：禁用 Workspace 后检查状态
  3. **disabled → active**：重新启用 Workspace 后检查状态
- **预期结果**:
  - 每个状态转换正确执行
  - 状态值与预期一致

---

## 5. 审计日志测试

### TC-AUDIT-WS-001: 验证创建 Workspace 生成审计日志

- **需求**: 创建 Workspace 时自动记录审计日志
- **优先级**: High
- **前置条件**: 用户为系统管理员
- **测试步骤**:
  1. 创建新的 Workspace
  2. 访问审计日志页面
- **预期结果**:
  - 生成 `workspace:create` 操作日志
  - 记录创建者信息和时间

### TC-AUDIT-WS-002: 验证更新 Workspace 生成审计日志

- **需求**: 更新 Workspace 时记录变更前后值
- **优先级**: High
- **前置条件**: 用户为 Workspace 所有者
- **测试步骤**:
  1. 编辑 Workspace 名称或描述
  2. 访问审计日志页面
- **预期结果**:
  - 生成 `workspace:update` 操作日志
  - 记录 `before_value` 和 `after_value`

### TC-AUDIT-WS-003: 验证成员变更生成审计日志

- **需求**: 添加/移除/修改成员时记录审计日志
- **优先级**: High
- **前置条件**: 用户为 Workspace 所有者
- **测试步骤**:
  1. 添加新成员
  2. 修改成员角色
  3. 移除成员
  4. 访问审计日志页面
- **预期结果**:
  - 生成 `member:add`、`member:update`、`member:remove` 操作日志
  - 记录被操作用户和变更内容

### TC-AUDIT-WS-004: 验证审计日志分页和过滤

- **需求**: 审计日志支持分页和按条件过滤
- **优先级**: Medium
- **前置条件**: Workspace 中有大量审计日志
- **测试步骤**:
  1. 按操作类型过滤
  2. 按时间范围过滤
  3. 分页查看日志
- **预期结果**:
  - 过滤条件正确生效
  - 分页导航正常

---

## 测试覆盖率矩阵

| 需求 ID | 需求描述 | 测试用例 | 覆盖率 |
|---------|----------|----------|--------|
| REQ-WS-001 | 创建 Workspace | TC-F-WS-001, TC-E-WS-001, TC-E-WS-002, TC-E-WS-003 | ✓ 完整 |
| REQ-WS-002 | 查看 Workspace 列表 | TC-F-WS-002, TC-F-WS-003, TC-F-WS-004 | ✓ 完整 |
| REQ-WS-003 | 编辑 Workspace 信息 | TC-F-WS-006, TC-E-WS-004, TC-E-WS-005, TC-E-WS-006 | ✓ 完整 |
| REQ-WS-004 | 禁用 Workspace | TC-F-WS-007, TC-E-WS-007, TC-ST-WS-001 | ✓ 完整 |
| REQ-WS-005 | 启用 Workspace | TC-F-WS-008, TC-ST-WS-001 | ✓ 完整 |
| REQ-WS-006 | 成员管理 | TC-F-WS-009, TC-F-WS-010, TC-E-WS-009 | ✓ 完整 |
| REQ-WS-007 | 用户视角 Workspace | TC-F-WS-011, TC-F-WS-012 | ✓ 完整 |
| REQ-WS-008 | 权限控制 | TC-E-WS-008, TC-ERR-WS-002 | ✓ 完整 |
| REQ-WS-009 | 审计日志 | TC-AUDIT-WS-001~004 | ✓ 完整 |

---

## 备注

- 测试数据：使用 `13800138002`（密码：`abcd1234`）作为超级管理员
- Workspace 创建前需确认有可用组织
- 成员管理测试需要准备多个测试用户账号
- 状态转换测试需注意清理测试数据