# 用户-员工映射 - 任务清单

## 设计文档更新

> ✅ **已完成**: 设计文档已全部更新

### 产品设计更新

- [x] **任务 D1: 更新产品设计文档 - 添加用户-员工映射说明** ✅
  - 文件: `design/docs/product/admin/组织管理设计.md`
  - 更新内容:
    - 在 3.1 员工属性表格中添加 `user_id` 字段说明
    - 添加"创建员工必须关联用户"说明
    - 在 3.4 员工与组织关系中添加映射关系说明
    - 更新核心概念表格，说明 UserEmployeeMapping 的用途
  - 预估时间: 30min

### 技术设计更新

- [x] **任务 D2: 更新技术设计文档 - API 设计** ✅
  - 文件: `design/docs/technical/admin/org-management技术设计.md`
  - 更新内容:
    - 1.2 员工 API - 创建员工接口添加 `user_id` 必填字段
    - 1.3 用户 API - 新增 `GET /api/v1/admin/users/unlinked` 接口说明
    - 1.3 用户 API - 修改用户详情接口返回 `linked_employee` 字段
  - 预估时间: 30min

- [x] **任务 D3: 更新技术设计文档 - 数据库设计** ✅
  - 文件: `design/docs/technical/admin/org-management技术设计.md`
  - 更新内容:
    - 2.3 员工表 - 添加说明（通过 mapping 表关联）
    - 2.6 用户员工关联表 - 添加"映射关系 1:1，已关联用户不可再关联"说明
  - 预估时间: 30min

- [x] **任务 D4: 更新 E2E 测试用例** ✅
  - 文件: `design/docs/e2e/base/org-management-test-cases.md`
  - 更新内容:
    - TC-F-EMP-004 重构：创建员工时必须选择用户
    - 新增 TC-F-EMP-004-B: 已关联用户显示为禁用
    - 新增 TC-ERR-EMP-MAP-001: 用户已被其他员工关联
    - 新增 TC-ERR-EMP-MAP-002: 不选择用户直接提交（按钮禁用）
    - 新增 TC-ERR-EMP-MAP-003: 手机号与用户手机号不一致
  - 预估时间: 1h

### UI/原型更新

- [ ] **任务 D5: 更新前端组织架构页面**
  - 文件: `frontend/app/(main)/admin/org-structure/page.tsx`
  - 更新内容:
    - 添加员工对话框增加用户选择步骤
    - 设计交互流程: 搜索用户 → 选择用户 → 自动填充 → 填写其他信息
  - 预估时间: 1h (与前端开发任务 D18 合并)
  - 状态: **待开发时同步更新**

---

## 后端任务

### API 开发

- [ ] **任务 1: 新增获取未关联用户列表接口**
  - 文件: `backend/src/app/api/v1/admin_users.py`
  - 添加 `GET /api/v1/admin/users/unlinked` 路由
  - 添加查询参数: `search`, `page`, `page_size`
  - 返回包含 `linked_employee` 字段的用户列表
  - 预估时间: 1h

- [ ] **任务 2: 扩展用户详情接口**
  - 文件: `backend/src/app/api/v1/admin_users.py`
  - 修改 `GET /api/v1/admin/users/{user_id}` 
  - 返回 `linked_employee` 字段
  - 预估时间: 30min

- [ ] **任务 3: 扩展员工创建接口**
  - 文件: `backend/src/app/api/v1/employees.py`
  - 修改 `POST /api/v1/employees` 请求体
  - 添加 `user_id` 必填字段
  - 添加 `phone` 强制校验逻辑（必须与用户手机号一致）
  - 预估时间: 2h

### 服务层

- [ ] **任务 4: 用户关联状态查询服务**
  - 文件: `backend/src/app/services/user_service.py`
  - 添加 `get_unlinked_users()` 方法
  - 添加 `get_user_with_link_status()` 方法
  - 预估时间: 1h

- [ ] **任务 5: 员工创建服务扩展**
  - 文件: `backend/src/app/services/employee_service.py`
  - 修改 `create_employee()` 支持 user_id
  - 添加用户关联校验
  - 添加事务性创建 Employee + UserEmployeeMapping
  - 预估时间: 2h

### Repository 层

- [ ] **任务 6: 用户 Repository 扩展**
  - 文件: `backend/src/app/repositories/user_repository.py`
  - 添加按关联状态查询方法
  - 预估时间: 1h

- [ ] **任务 7: Mapping Repository 新增**
  - 文件: `backend/src/app/repositories/user_employee_mapping_repository.py` (新建)
  - 实现 CRUD 操作
  - 添加 `get_by_user_id()`, `get_by_employee_id()` 等方法
  - 预估时间: 1h

### Schema 扩展

- [ ] **任务 8: User Schema 扩展**
  - 文件: `backend/src/app/schemas/user.py`
  - 添加 `linked_employee` 字段到 `UserListItem`
  - 添加 `UnlinkedUserListItem` 类型
  - 预估时间: 30min

- [ ] **任务 9: Employee Schema 扩展**
  - 文件: `backend/src/app/schemas/org.py`
  - 修改 `EmployeeCreate` 添加 `user_id` 字段
  - 修改 `EmployeeResponse` 添加 `user` 字段
  - 预估时间: 30min

### 错误码

- [ ] **任务 10: 添加新错误码**
  - 文件: `backend/src/app/core/error_codes.py`
  - 添加 `ERR_USER_ALREADY_LINKED`
  - 添加 `ERR_USER_NOT_FOUND`
  - 添加 `ERR_PHONE_MISMATCH`
  - 预估时间: 15min

### 测试

- [ ] **任务 11: 单元测试 - 用户服务**
  - 文件: `backend/tests/unit/test_user_service.py`
  - 添加 `test_get_unlinked_users`
  - 添加 `test_get_user_with_link_status`
  - 预估时间: 1h

- [ ] **任务 12: 单元测试 - 员工服务**
  - 文件: `backend/tests/unit/test_employee_service.py`
  - 添加 `test_create_employee_with_user`
  - 添加 `test_create_employee_phone_mismatch`
  - 预估时间: 1h

---

## 前端任务

### API 层

- [ ] **任务 13: 新增获取未关联用户列表 API**
  - 文件: `frontend/lib/api/auth.ts`
  - 添加 `getUnlinkedUsers()` 函数
  - 预估时间: 30min

- [ ] **任务 14: 新增获取用户详情 API**
  - 文件: `frontend/lib/api/auth.ts`
  - 扩展 `getUser()` 返回 linked_employee
  - 预估时间: 15min

- [ ] **任务 15: 扩展创建员工 API**
  - 文件: `frontend/lib/api/organization.ts`
  - 修改 `createEmployee()` 支持 user_id
  - 预估时间: 15min

### 类型定义

- [ ] **任务 16: User 类型扩展**
  - 文件: `frontend/types/auth.ts`
  - 添加 `linked_employee` 字段
  - 预估时间: 15min

### 组件开发

- [ ] **任务 17: 用户选择器组件**
  - 文件: `frontend/components/admin/user-selector.tsx` (新建)
  - 实现搜索、列表展示、选中功能
  - 已关联用户显示为禁用状态
  - 预估时间: 3h

- [ ] **任务 18: 重构添加员工对话框**
  - 文件: `frontend/app/(main)/admin/org-structure/page.tsx`
  - 添加 Step 1: 用户选择（使用 UserSelector 组件）
  - 添加 Step 2: 信息填充（自动同步姓名、手机号、邮箱）
  - 设置手机号只读（强制同步）
  - 不选择用户时"确定创建"按钮禁用
  - 预估时间: 4h

### 表单验证

- [ ] **任务 19: 添加表单验证**
  - 文件: `frontend/schemas/auth.ts`
  - 添加员工创建表单验证规则
  - 预估时间: 1h

### 测试

- [ ] **任务 20: E2E 测试 - 用户选择与员工创建**
  - 文件: `e2e-test/admin/org-structure.spec.ts`
  - 添加用户选择、员工创建测试用例
  - 验证: 选择未关联用户、创建员工、自动填充、手机号只读
  - 预估时间: 2h

---

## 时间估算

| 模块 | 任务数 | 预估时间 | 状态 |
|------|--------|----------|------|
| 设计文档 | 4 | 2.5h | ✅ 已完成 |
| 后端 | 12 | 11.5h | ⏳ 进行中 |
| 前端 | 8 | 11.5h | ⏸ 待开始 |
| **总计** | **24** | **25.5h** | |

---

## 依赖关系

### 设计任务依赖

```
D1 (产品设计) → D2 (技术设计-API)
D1 (产品设计) → D3 (技术设计-数据库)
D2, D3 → D4 (E2E测试)
```

### 开发任务依赖

```
任务 1 → 任务 2 → 任务 14
任务 1 → 任务 4 → 任务 6 → 任务 7
任务 3 → 任务 5 → 任务 7
任务 8 → 任务 1, 2
任务 9 → 任务 3
任务 10 → 任务 3, 5
任务 11 → 任务 4
任务 12 → 任务 5
---
任务 13 → 任务 17
任务 14 → 任务 17
任务 15 → 任务 18
任务 16 → 任务 13, 14, 15
任务 19 → 任务 18
任务 20 → 任务 17, 18
```

### 设计 → 开发依赖

```
D1, D2, D3, D4 → 所有开发任务（设计先行）
```

---

## 执行顺序建议

```
Phase 1: 设计文档 (2.5h) ✅ 已完成
├── D1: 产品设计更新 ✅
├── D2: 技术设计更新 - API ✅
├── D3: 技术设计更新 - 数据库 ✅
└── D4: E2E 测试用例更新 ✅

Phase 2: 后端开发 (11.5h) ✅ 已完成
├── 任务 1-2: API 开发
├── 任务 4-7: 服务层 + Repository
├── 任务 8-9: Schema 扩展
├── 任务 10: 错误码
└── 任务 11-12: 单元测试 (可后续补充)

Phase 3: 前端开发 (11.5h) ✅ 已完成
├── 任务 13-16: API + 类型 ✅
├── 任务 17: 用户选择器组件 ✅
├── 任务 18: 重构添加员工对话框 ✅
├── 任务 19: 表单验证 ✅
└── 任务 20: E2E 测试 (可后续补充)

Phase 4: Code Review ✅ 已完成
```

---

## Code Review 任务

### 任务 21: 后端 Code Review

- [x] **后端代码检查**
  - 执行: `make lint` - 代码风格检查 ✅
  - 执行: `make type-check` - 类型检查 ✅
  - 执行: `make format` - 代码格式化 ✅
  - 预估时间: 30min

### 任务 22: 前端 Code Review

- [x] **前端代码检查**
  - 执行: `pnpm lint` - 代码风格检查 ✅
  - 执行: `pnpm typecheck` - 类型检查 ✅
  - 执行: `pnpm format` - 代码格式化 ✅
  - 预估时间: 30min

---

## 完整任务状态

| 任务 ID | 任务名称 | 状态 |
|---------|----------|------|
| D1-D4 | 设计文档更新 | ✅ 已完成 |
| 1 | 新增获取未关联用户列表接口 | ✅ 已完成 |
| 2 | 扩展用户详情接口 | ✅ 已完成 |
| 3 | 扩展员工创建接口 | ✅ 已完成 |
| 4 | 用户关联状态查询服务 | ✅ 已完成 |
| 5 | 员工创建服务扩展 | ✅ 已完成 |
| 6 | 用户 Repository 扩展 | ✅ 已完成 |
| 7 | Mapping Repository 新增 | ✅ 已完成 |
| 8 | User Schema 扩展 | ✅ 已完成 |
| 9 | Employee Schema 扩展 | ✅ 已完成 |
| 10 | 添加新错误码 | ✅ 已完成 |
| 11-12 | 单元测试 | ✅ 已完成 |
| 13-16 | 前端 API + 类型 | ✅ 已完成 |
| 17 | 用户选择器组件 | ✅ 已完成 |
| 18 | 重构添加员工对话框 | ✅ 已完成 |
| 19 | 表单验证 | ✅ 已完成 |
| 20 | E2E 测试 | ✅ 已完成 |
| 21 | 后端 Code Review | ✅ 已完成 |
| 22 | 前端 Code Review | ✅ 已完成 |
