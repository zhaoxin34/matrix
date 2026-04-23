## Context

CDP 平台当前没有多租户概念，所有数据（员工、组织）存储在同一空间。AI 研究人员需要隔离不同实验场景的数据，但现有架构无法支持。项目功能提供多租户数据隔离的基础架构。

### 约束

- 向后兼容：现有 is_admin 用户不受项目限制
- 现有 Repository/Service 模式必须遵循
- 前端通过 `x-project-id` header 传递项目上下文

## Goals / Non-Goals

**Goals:**
- 实现项目、成员、组织关联的完整 CRUD
- 通过 org_project 关联表实现数据访问控制
- 提供清晰的 API 接口供前后端调用

**Non-Goals:**
- 完整的项目数据隔离中间件（仅建立关联关系）
- 项目级别的 Webhook 或事件通知
- 子项目嵌套
- 项目配额/计费功能

## Decisions

### 1. 数据库表设计

**Decision:** 创建 3 张表（project, project_member, org_project）

**Rationale:**
- `project` 表：存储项目基本信息，与业务数据解耦
- `project_member` 表：用户-项目 N:M 关系，支持角色区分
- `org_project` 表：组织-项目 N:M 关系，控制数据访问范围

**Alternatives considered:**
- 只用外键关联到现有表会导致循环依赖
- 通过 JSONB 存储成员信息无法支持高效查询

**索引策略：**
```sql
CREATE INDEX idx_project_member_user_id ON project_member(user_id);
CREATE INDEX idx_project_member_project_id ON project_member(project_id);
CREATE INDEX idx_org_project_org_id ON org_project(org_id);
CREATE INDEX idx_org_project_project_id ON org_project(project_id);
```

### 2. 后端架构分层

**Decision:** 遵循现有 Repository → Service → API 分层模式

**Rationale:**
- 与现有 Employee 模块保持一致
- 便于后续扩展和维护

**新增模块结构：**
```
backend/src/app/
├── api/v1/
│   └── projects.py          # 路由入口
├── services/
│   └── project_service.py   # 业务逻辑
├── repositories/
│   └── project_repo.py     # 数据访问
├── models/
│   └── project.py          # SQLAlchemy 模型
└── schemas/
    └── project.py          # Pydantic schemas
```

### 3. API 设计

**Decision:** RESTful API，通过 `x-project-id` header 传递项目上下文

**Rationale:**
- 与现有 API 风格保持一致
- header 方式避免 URL 污染，支持代理转发

**API 端点设计：**
```
POST   /api/v1/projects                    # 创建项目
GET    /api/v1/projects                    # 列表项目
GET    /api/v1/projects/{id}              # 项目详情
PUT    /api/v1/projects/{id}              # 更新项目
DELETE /api/v1/projects/{id}              # 删除项目

POST   /api/v1/projects/{id}/members      # 添加成员
GET    /api/v1/projects/{id}/members      # 成员列表
PUT    /api/v1/projects/{id}/members/{user_id}  # 更新角色
DELETE /api/v1/projects/{id}/members/{user_id}  # 移除成员

POST   /api/v1/projects/{id}/organizations      # 关联组织
GET    /api/v1/projects/{id}/organizations      # 关联组织列表
DELETE /api/v1/projects/{id}/organizations/{org_id}  # 取消关联

GET    /api/v1/users/me/projects          # 当前用户项目列表
```

### 4. 错误码设计

**Decision:** 遵循现有错误码体系

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | Invalid Parameter |
| 1002 | Unauthorized |
| 2001 | User Not Found |
| 3001 | Resource Not Found |
| 3002 | Organization Not Found |

### 5. 权限控制

**Decision:** 项目级别权限检查（非全局 is_admin）

**Rationale:**
- 项目管理员只能管理自己项目的成员
- 普通成员只能查看项目信息

**权限检查逻辑：**
```python
def check_project_admin(project_id: int, user_id: int) -> bool:
    # 1. 检查用户是否是项目管理员
    # 2. 或检查用户是否是全局 is_admin（向后兼容）
```

## Risks / Trade-offs

[Risk] 项目删除时的数据清理
→ **Mitigation:** 使用 SQLAlchemy cascade="all, delete-orphan" 自动清理 project_member

[Risk] 关联查询性能问题
→ **Mitigation:** 在 org_project 表的关键列上添加复合索引

[Risk] 跨项目数据查询
→ **Mitigation:** 所有组织和员工查询必须通过 project_id 过滤，暂不支持跨项目查询

## Migration Plan

1. 创建数据库迁移脚本 `004_add_project_tables.py`
2. 编写 Alembic 迁移：
   - 创建 project 表（含唯一索引）
   - 创建 project_member 表（含外键和索引）
   - 创建 org_project 表（含外键和索引）
3. 执行迁移并验证
4. 部署后端代码
5. 前端新增项目管理页面

**Rollback:** 使用 `alembic downgrade <previous_revision>` 回滚数据库变更

## Open Questions

1. 项目是否需要设置默认项目？
2. 是否需要项目级别的审计日志？
3. 跨项目数据引用如何处理？
