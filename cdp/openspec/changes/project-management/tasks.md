## 1. 数据库迁移

- [ ] 1.1 创建 Alembic 迁移脚本 `004_add_project_tables.py`
- [ ] 1.2 定义 `project` 表结构（id, name, code, description, status, created_at, updated_at）
- [ ] 1.3 定义 `project_member` 表结构（id, project_id, user_id, role, created_at），包含外键和索引
- [ ] 1.4 定义 `org_project` 表结构（id, org_id, project_id, created_at），包含外键和索引
- [ ] 1.5 在 project.code 上创建唯一索引
- [ ] 1.6 在 project_member 上创建复合索引（project_id, user_id）
- [ ] 1.7 在 org_project 上创建复合索引（org_id, project_id）
- [ ] 1.8 执行迁移并验证表结构正确

## 2. 后端模型

- [ ] 2.1 创建 `Project` SQLAlchemy 模型
- [ ] 2.2 创建 `ProjectMember` SQLAlchemy 模型
- [ ] 2.3 创建 `OrgProject` SQLAlchemy 模型
- [ ] 2.4 配置 cascade 删除关系（ProjectMember 随 Project 删除）

## 3. 后端 Schema

- [ ] 3.1 创建 `ProjectCreate` Pydantic schema（name, code, description）
- [ ] 3.2 创建 `ProjectUpdate` Pydantic schema（name, description 可选）
- [ ] 3.3 创建 `ProjectResponse` Pydantic schema
- [ ] 3.4 创建 `ProjectMemberCreate` Pydantic schema（user_id, role）
- [ ] 3.5 创建 `ProjectMemberUpdate` Pydantic schema（role）
- [ ] 3.6 创建 `ProjectMemberResponse` Pydantic schema
- [ ] 3.7 创建 `OrgProjectCreate` Pydantic schema（org_id）
- [ ] 3.8 创建 `OrgProjectResponse` Pydantic schema
- [ ] 3.9 创建分页相关 schema（ProjectListResponse）

## 4. 后端 Repository 层

- [ ] 4.1 创建 `ProjectRepository` 类
- [ ] 4.2 实现 `create` 方法
- [ ] 4.3 实现 `get_by_id` 方法
- [ ] 4.4 实现 `get_by_code` 方法
- [ ] 4.5 实现 `update` 方法
- [ ] 4.6 实现 `delete` 方法
- [ ] 4.7 实现 `list` 方法（分页）
- [ ] 4.8 创建 `ProjectMemberRepository` 类
- [ ] 4.9 实现 `create` 方法
- [ ] 4.10 实现 `get_by_project_and_user` 方法
- [ ] 4.11 实现 `update_role` 方法
- [ ] 4.12 实现 `delete` 方法
- [ ] 4.13 实现 `list_by_project` 方法
- [ ] 4.14 创建 `OrgProjectRepository` 类
- [ ] 4.15 实现 `create` 方法
- [ ] 4.16 实现 `get_by_org_and_project` 方法
- [ ] 4.17 实现 `delete` 方法
- [ ] 4.18 实现 `list_by_project` 方法

## 5. 后端 Service 层

- [ ] 5.1 创建 `ProjectService` 类
- [ ] 5.2 实现 `create_project` 方法（含 code 唯一性校验）
- [ ] 5.3 实现 `get_project` 方法
- [ ] 5.4 实现 `update_project` 方法（含权限校验）
- [ ] 5.5 实现 `delete_project` 方法（含 cascade 清理）
- [ ] 5.6 实现 `list_projects` 方法
- [ ] 5.7 创建 `ProjectMemberService` 类
- [ ] 5.8 实现 `add_member` 方法（含角色校验）
- [ ] 5.9 实现 `remove_member` 方法（含最后管理员检查）
- [ ] 5.10 实现 `update_member_role` 方法
- [ ] 5.11 实现 `list_members` 方法
- [ ] 5.12 创建 `OrgProjectService` 类
- [ ] 5.13 实现 `associate_org` 方法
- [ ] 5.14 实现 `disassociate_org` 方法
- [ ] 5.15 实现 `list_project_orgs` 方法

## 6. 后端 API 路由

- [ ] 6.1 创建 `/api/v1/projects` 路由文件
- [ ] 6.2 实现 `POST /projects` 创建项目
- [ ] 6.3 实现 `GET /projects` 列表项目
- [ ] 6.4 实现 `GET /projects/{id}` 项目详情
- [ ] 6.5 实现 `PUT /projects/{id}` 更新项目
- [ ] 6.6 实现 `DELETE /projects/{id}` 删除项目
- [ ] 6.7 实现 `POST /projects/{id}/members` 添加成员
- [ ] 6.8 实现 `GET /projects/{id}/members` 成员列表
- [ ] 6.9 实现 `PUT /projects/{id}/members/{user_id}` 更新角色
- [ ] 6.10 实现 `DELETE /projects/{id}/members/{user_id}` 移除成员
- [ ] 6.11 实现 `POST /projects/{id}/organizations` 关联组织
- [ ] 6.12 实现 `GET /projects/{id}/organizations` 关联组织列表
- [ ] 6.13 实现 `DELETE /projects/{id}/organizations/{org_id}` 取消关联
- [ ] 6.14 在 `/api/v1/users/me/projects` 实现用户项目列表查询
- [ ] 6.15 添加项目级权限检查中间件

## 7. 前端 - 项目管理页面

- [ ] 7.1 创建 `ProjectList` 页面组件
- [ ] 7.2 创建 `ProjectCreate` 对话框组件
- [ ] 7.3 创建 `ProjectDetail` 页面组件
- [ ] 7.4 实现项目创建表单（name, code, description）
- [ ] 7.5 实现项目列表展示（分页、状态筛选）
- [ ] 7.6 实现项目编辑功能
- [ ] 7.7 实现项目删除功能（含确认对话框）

## 8. 前端 - 成员管理

- [ ] 8.1 在项目详情页添加成员管理 Tab
- [ ] 8.2 实现成员列表展示
- [ ] 8.3 实现添加成员功能（输入 user_id）
- [ ] 8.4 实现移除成员功能
- [ ] 8.5 实现角色切换功能（admin/member）

## 9. 前端 - 组织关联

- [ ] 9.1 在项目详情页添加组织关联 Tab
- [ ] 9.2 实现组织列表展示
- [ ] 9.3 实现关联组织功能
- [ ] 9.4 实现取消关联功能

## 10. 前端 - 项目切换器

- [ ] 10.1 创建 `ProjectSwitcher` 组件（用于切换当前项目）
- [ ] 10.2 在 Header 或侧边栏添加项目切换入口
- [ ] 10.3 实现项目上下文存储（Zustand store）
- [ ] 10.4 在 API 请求中自动添加 `x-project-id` header
- [ ] 10.5 实现用户项目列表查询（GET /api/v1/users/me/projects）

## 11. 集成测试

- [ ] 11.1 编写项目 CRUD 的单元测试
- [ ] 11.2 编写成员管理的单元测试
- [ ] 11.3 编写组织关联的单元测试
- [ ] 11.4 验证数据库迁移正确执行
- [ ] 11.5 验证 API 端点正常工作