## Why

CDP平台需要管理员功能来管理用户账号。目前只有用户注册功能，没有管理员创建和管理用户的入口。需要增加"用户管理"功能，允许管理员创建、编辑、删除用户账号。

## What Changes

- 新增"用户管理"菜单，仅对 `is_admin=True` 的用户可见
- 管理员可查看用户列表（用户名、手机号、邮箱、是否管理员）
- 管理员可创建新用户（用户名、手机号、邮箱、是否管理员）
- 管理员可编辑已有用户信息
- 管理员可删除用户，删除前校验用户是否已绑定员工（通过 UserEmployeeMapping）
- 删除校验：若用户已绑定员工，提示"用户已经是xxx组织的成员，暂时不能删除，如想删除，需要先去组织里解绑用户"

## Capabilities

### New Capabilities
- `user-admin`: 管理员用户管理能力，包括用户列表、创建、编辑、删除功能

### Modified Capabilities
- (无)

## Impact

- **后端**: 新增 `/admin/users` API 端点（GET/POST/DELETE）
- **前端**: 新增用户管理页面、菜单权限控制
- **数据模型**: 无新增模型，复用现有 User 模型和 UserEmployeeMapping
