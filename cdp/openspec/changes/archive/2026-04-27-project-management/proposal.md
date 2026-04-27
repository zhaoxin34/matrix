## Why

当前 CDP 平台缺乏多租户概念，所有数据（员工、组织结构）都在同一空间混合存储。AI 研究人员需要隔离不同实验场景的数据和配置，但现有架构无法满足这一需求。通过引入"项目"（Project）概念，可以在共享组织数据的同时保持业务数据独立，实现类似 Notion/Linear workspace 的数据隔离能力。

## What Changes

- 新增 `project` 表：存储项目基本信息（name, code, description, status）
- 新增 `project_member` 表：存储项目成员关系和角色（admin/member）
- 新增 `org_project` 关联表：控制项目可访问的组织范围
- 新增项目管理 API：创建项目、查询项目、删除项目
- 新增成员管理 API：添加成员、移除成员、更新角色
- 新增组织关联 API：关联组织到项目、取消关联
- 前端新增项目管理页面和项目切换功能

## Capabilities

### New Capabilities

- `project`: 项目管理能力，包括创建、更新、删除、查询项目
- `project-member`: 项目成员管理能力，包括添加、移除成员，设置管理员/成员角色
- `project-org-association`: 项目与组织的关联管理能力，控制项目可访问的组织数据范围
- `user-projects`: 用户项目列表查询能力，允许用户查看自己所属的所有项目

### Modified Capabilities

- （无）现有 capabilities 没有需求变更

## Impact

- **数据库**：新增 3 张表（project, project_member, org_project）
- **后端 API**：新增 `/api/v1/projects` 路由及子路由
- **前端**：新增项目管理页面、项目切换器
- **依赖**：
  - 数据库迁移脚本（004_add_project_tables.py）
  - 现有 Repository/Service 模式（参考 EmployeeRepository）
  - Zustand Store 模式（参考 authStore）
