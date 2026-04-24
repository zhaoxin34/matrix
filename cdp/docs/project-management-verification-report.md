# Project Management Spec 验证报告

**验证日期**: 2026-04-24
**验证范围**: 4 个 Project Management Spec 实现验证

---

## 概述

| Spec | 文件 | 结果 |
|------|------|------|
| Project CRUD | `specs/project/spec.md` | 部分通过 |
| Project Member | `specs/project-member/spec.md` | 部分通过 |
| Project Org Association | `specs/project-org-association/spec.md` | 部分通过 |
| User Projects | `specs/user-projects/spec.md` | 部分通过 |
| Frontend UI | ProjectListPage, ProjectDetailPage, ProjectSwitcher | 通过 |

**核心问题**: 错误响应格式不统一，大部分 API 使用 `{"detail": "..."}` 而非 spec 规定的 `{"code": xxx, "message": "..."}` 格式。

---

## 后端 API 验证结果

### 1. Project CRUD (Task #1)

| API | 方法 | 场景 | 预期 | 实际 | 状态 |
|-----|------|------|------|------|------|
| POST /projects | 创建项目 | 正常 | code: 0 | code: 0 | PASS |
| GET /projects | 列表查询 | 正常 | code: 0 | code: 0 | PASS |
| GET /projects/{id} | 获取单个 | 正常 | code: 0 | code: 0 | PASS |
| PUT /projects/{id} | 更新项目 | 正常 | code: 0 | code: 0 | PASS |
| DELETE /projects/{id} | 删除项目 | 正常 | code: 0 | code: 0 | PASS |
| POST /projects | 重复code | code: 1001 | `{"detail":"..."}` | FAIL |

**问题列表**:
- 重复 code 校验返回 `{"detail":"项目代码已存在"}` 而非 `{"code":1001,"message":"code 已存在"}`
- 错误响应格式不统一

---

### 2. Project Member (Task #2)

| API | 方法 | 场景 | 预期 | 实际 | 状态 |
|-----|------|------|------|------|
| POST /projects/{id}/members | 添加成员 | 正常 | code: 0 | code: 0 | PASS |
| POST /projects/{id}/members | 添加已存在 | code: 1001 | `{"detail":"..."}` | FAIL |
| POST /projects/{id}/members | 添加不存在用户 | code: 2001 | Internal Server Error | FAIL |
| GET /projects/{id}/members | 获取列表 | 正常 | code: 0 | code: 0 | PASS |
| PUT /projects/{id}/members/{user_id} | 更新角色 | 正常 | code: 0 | code: 0 | PASS |
| DELETE /projects/{id}/members/{user_id} | 移除成员 | 正常 | code: 0 | code: 0 | PASS |
| DELETE | 移除最后管理员 | 允许操作 | 应允许 | `{"detail":"不能移除最后一个管理员"}` | FAIL |

**问题列表**:
- 错误响应使用 `detail` 字段而非 `code`/`message` 标准格式
- 添加不存在用户返回 500 Internal Server Error，应返回 code: 2001
- 移除最后一个管理员被拒绝，与 spec "系统 SHALL 允许此操作" 矛盾

---

### 3. Project Org Association (Task #4)

| API | 方法 | 场景 | 预期 | 实际 | 状态 |
|-----|------|------|------|------|
| POST /projects/{id}/organizations | 关联组织 | 正常 | code: 0 | code: 0 | PASS |
| POST | 重复关联 | code: 1001 | `{"detail":"..."}` | FAIL |
| POST | 关联不存在组织 | code: 3002 | Internal Server Error | FAIL |
| GET /projects/{id}/organizations | 获取列表 | 正常 | code: 0 | code: 0 | PASS |
| DELETE /projects/{id}/organizations/{org_id} | 取消关联 | 正常 | code: 0 | code: 0 | PASS |
| DELETE | 取消不存在关联 | code: 3001 | `{"detail":"..."}` | FAIL |

**问题列表**:
- 所有错误场景返回 `detail` 而非标准 `code`/`message` 格式
- 关联不存在组织返回 500 而非 code: 3002
- 取消不存在关联返回 `detail` 而非 code: 3001

---

### 4. User Projects (Task #6)

| API | 方法 | 场景 | 预期 | 实际 | 状态 |
|-----|------|------|------|------|
| GET /users/me/projects | 正常获取 | code: 0 | code: 0 | PASS |
| GET /users/me/projects | 用户无项目 | 空数组 | 空数组 | PASS |

**问题列表**:
- 查询非成员项目时返回空数组（code: 0）而非 spec 规定的错误码 1002

---

## 前端 UI 验证结果 (Task #3)

| 页面/组件 | 功能 | 状态 |
|----------|------|------|
| 登录页面 | 登录流程 | PASS |
| ProjectListPage | 页面加载 | PASS |
| ProjectListPage | 创建项目 | PASS |
| ProjectListPage | 项目列表显示 | PASS |
| ProjectListPage | 分页功能 | PASS |
| ProjectDetailPage | 成员 Tab | PASS |
| ProjectDetailPage | 组织 Tab | PASS |
| data-testid 属性 | 存在且正确 | PASS |

**前端 UI 功能验证全部通过**，所有主要操作元素都有正确的 `data-testid` 属性。

---

## 问题清单汇总

| # | 模块 | 问题描述 | 严重程度 |
|---|------|----------|----------|
| 1 | 全局 | 错误响应格式不统一，使用 `{"detail":"..."}` 而非 `{"code":..., "message":...}` | 高 |
| 2 | Project CRUD | 重复 code 返回格式错误 | 中 |
| 3 | Project Member | 添加不存在用户返回 500 而非 code: 2001 | 中 |
| 4 | Project Member | 移除最后一个管理员被拒绝，与 spec 矛盾 | 中 |
| 5 | Project Org | 关联不存在组织返回 500 而非 code: 3002 | 中 |
| 6 | Project Org | 取消不存在关联返回格式错误 | 低 |
| 7 | User Projects | 查询非成员项目返回空数组而非 code: 1002 | 低 |

---

## 修复建议

### 1. 统一错误响应格式（优先级：高）

**问题**: 所有 API 的错误响应格式不统一，违反 api-rule.md 规范。

**修复方案**: 在 `backend/src/app/core/exceptions.py` 或类似位置定义统一的异常处理，确保所有错误响应返回:
```json
{
  "code": <错误码>,
  "message": "<错误描述>",
  "traceId": "<请求ID>",
  "timestamp": <毫秒时间戳>
}
```

### 2. Project CRUD - 错误格式修复（优先级：中）

**文件**: `backend/src/app/services/project_service.py`

当项目代码重复时，应抛出自定义异常并返回:
```json
{"code": 1001, "message": "项目代码已存在", "traceId": "...", "timestamp": ...}
```

### 3. Project Member - 用户不存在处理（优先级：中）

**文件**: `backend/src/app/services/project_member_service.py`

添加成员时检查用户是否存在，如不存在抛出 `UserNotFoundException`:
```python
if not user:
    raise UserNotFoundException()
```

### 4. Project Member - 最后管理员逻辑修正（优先级：中）

**文件**: `backend/src/app/services/project_member_service.py`

根据 spec，系统 SHALL 允许移除最后一个管理员。当前实现禁止此操作，需要修正业务逻辑。

### 5. Project Org Association - 错误码修复（优先级：中）

**文件**: `backend/src/app/services/project_org_service.py`

- 关联不存在组织时返回 code: 3002 (Organization Not Found)
- 取消不存在关联时返回 code: 3001 (Association Not Found)

### 6. User Projects - 非成员项目处理（优先级：低）

**文件**: `backend/src/app/services/user_project_service.py`

查询用户项目时，如项目不存在或用户不是成员，应返回 code: 1002 而非空数组。

---

## 结论

- **前端 UI**: 全部通过，功能完整
- **后端 API**: 基本功能正常，但错误处理需要统一规范化
- **核心修复项**: 1 个高优先级（错误格式统一）+ 5 个中优先级

建议优先修复错误响应格式问题，这将影响所有 API 端点。