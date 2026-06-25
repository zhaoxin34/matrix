## 1. 数据库迁移

- [x] 1.1 创建 `event` 数据表（包含所有字段、索引、外键约束）
- [x] 1.2 创建 `status` 数据表（包含所有字段、索引、外键约束，唯一约束）
- [x] 1.3 添加 `created_by` 外键索引
- [x] 1.4 编写数据库回滚脚本

## 2. 后端 API - Event

- [x] 2.1 实现 Event 模型 (SQLAlchemy)
- [x] 2.2 实现 Event Schema (Pydantic)
- [x] 2.3 实现 Event CRUD Service
- [x] 2.4 实现 GET `/api/v1/workspaces/{workspace_code}/events` 列表 API
- [x] 2.5 实现 GET `/api/v1/workspaces/{workspace_code}/events/{id}` 详情 API
- [x] 2.6 实现 POST `/api/v1/workspaces/{workspace_code}/events` 创建 API
- [x] 2.7 实现 PUT `/api/v1/workspaces/{workspace_code}/events/{id}` 更新 API
- [x] 2.8 实现 DELETE `/api/v1/workspaces/{workspace_code}/events/{id}` 删除 API
- [x] 2.9 添加字段验证（entity_name 格式、必填校验）
- [x] 2.10 编写 Event API 单元测试

## 3. 后端 API - Status

- [x] 3.1 实现 Status 模型 (SQLAlchemy)
- [x] 3.2 实现 Status Schema (Pydantic)
- [x] 3.3 实现 Status CRUD Service
- [x] 3.4 实现 GET `/api/v1/workspaces/{workspace_code}/status` 列表 API
- [x] 3.5 实现 GET `/api/v1/workspaces/{workspace_code}/status/{id}` 详情 API
- [x] 3.6 实现 POST `/api/v1/workspaces/{workspace_code}/status` 创建 API
- [x] 3.7 实现 PUT `/api/v1/workspaces/{workspace_code}/status/{id}` 更新 API
- [x] 3.8 实现 DELETE `/api/v1/workspaces/{workspace_code}/status/{id}` 删除 API
- [x] 3.9 添加字段验证（attributes JSON 校验、唯一约束）
- [x] 3.10 编写 Status API 单元测试

## 4. 前端 - Event 页面

- [x] 4.1 创建 Event 列表页组件 (`/workspace/[workspace_code]/events/page.tsx`)
- [x] 4.2 实现 Event 列表数据获取和分页
- [x] 4.3 实现 Event 列表过滤组件（name 搜索）
- [x] 4.4 创建 Event 详情页组件 (`/workspace/[workspace_code]/events/[id]/page.tsx`)
- [x] 4.5 创建 Event 创建页组件 (`/workspace/[workspace_code]/events/new/page.tsx`)
- [x] 4.6 创建 Event 编辑页组件 (`/workspace/[workspace_code]/events/[id]/edit/page.tsx`)
- [x] 4.7 实现 Event 表单组件（包含字段验证）
- [x] 4.8 添加删除确认对话框

## 5. 前端 - Status 页面

- [x] 5.1 创建 Status 列表页组件 (`/workspace/[workspace_code]/status/page.tsx`)
- [x] 5.2 实现 Status 列表数据获取和分页
- [x] 5.3 实现 Status 列表过滤组件（entity_name 搜索）
- [x] 5.4 创建 Status 详情页组件 (`/workspace/[workspace_code]/status/[id]/page.tsx`)
- [x] 5.5 创建 Status 创建页组件 (`/workspace/[workspace_code]/status/new/page.tsx`)
- [x] 5.6 创建 Status 编辑页组件 (`/workspace/[workspace_code]/status/[id]/edit/page.tsx`)
- [x] 5.7 实现 Status 表单组件（包含 attributes JSON 编辑器）
- [x] 5.8 添加删除确认对话框

## 6. 前端路由和导航

- [x] 6.1 注册 Event 相关路由（列表、详情、创建、编辑）
- [x] 6.2 注册 Status 相关路由（列表、详情、创建、编辑）
- [x] 6.3 在 Workspace 侧边栏添加入口链接

## 7. 集成和验证

- [x] 7.1 端到端测试验证 Event CRUD 功能
- [x] 7.2 端到端测试验证 Status CRUD 功能
- [x] 7.3 测试列表过滤和分页功能
- [ ] 7.4 测试权限控制（无权限用户不能访问）
