## Context

CDP平台需要管理员用户管理功能。现有系统只有 `is_admin` 布尔标志区分管理员和普通用户，无角色概念。

**当前状态**：
- User 模型有 `is_admin: bool` 字段
- User 和 Employee 通过 `UserEmployeeMapping` 1:1 映射
- 前端菜单硬编码，无权限控制

## Goals / Non-Goals

**Goals:**
- 管理员可创建、编辑、删除用户
- 用户列表展示用户名、手机号、邮箱、是否管理员
- 删除前校验用户是否已绑定员工
- 前端菜单根据 `is_admin` 条件渲染

**Non-Goals:**
- 不引入完整的RBAC角色权限系统
- 不支持普通用户自我管理（管理员操作）

## Decisions

### 1. API 设计

**端点**：`/api/v1/admin/users`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | / | 用户列表（分页） |
| POST | / | 创建用户 |
| PUT | /{id} | 编辑用户 |
| DELETE | /{id} | 删除用户 |

**响应格式**：遵循现有 `/api-rule.md` 规范：
```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "traceId": "xxx",
  "timestamp": 1234567890
}
```

### 2. 数据模型

复用现有 User 模型，新增字段：
- `username`: 用户名（唯一）
- `phone`: 手机号（唯一）
- `email`: 邮箱（可选）
- `is_admin`: 是否管理员

**删除校验**（before_delete 钩子）：
```python
def before_delete_user(user_id: int) -> None:
    mapping = find_mapping_by_user_id(user_id)
    if mapping:
        employee = get_employee(mapping.employee_id)
        org_name = get_org_unit_name(employee.primary_unit_id)
        raise HTTPException(
            status_code=400,
            detail=f"用户已经是「{org_name}」组织的成员，暂时不能删除，如想删除，需要先去组织里解绑用户"
        )
```

### 3. 前端架构

- **路由**：`/admin/users`（需要管理员权限）
- **页面组件**：`src/pages/UserManagement/`
  - `UserManagementPage.tsx` - 主页面
  - `UserModal.tsx` - 创建/编辑用户模态框
- **API模块**：`src/api/modules/userAdmin.ts`
- **菜单控制**：Header.tsx 根据 `authStore.isAdmin` 条件渲染

### 4. 目录结构

```
backend/src/app/
├── api/v1/
│   └── admin_users.py      # 新增
├── services/
│   └── admin_user_service.py  # 新增

frontend/src/
├── pages/UserManagement/   # 新增目录
│   ├── index.ts
│   ├── UserManagementPage.tsx
│   ├── UserModal.tsx
│   └── UserTable.tsx
├── api/modules/
│   └── userAdmin.ts       # 新增
```

## Risks / Trade-offs

| 风险 |  Mitigation |
|------|-------------|
| 用户删除后数据不一致 | before_delete 校验必须通过才可删除 |
| 前端菜单权限绕过 | 后端 API 也需要校验 `is_admin` |
| 重复绑定用户 | 创建/编辑时校验手机号唯一性 |
