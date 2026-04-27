## 1. Database Migration

- [x] 1.1 创建 Alembic 迁移文件，添加 `skill` 表
- [x] 1.2 验证迁移脚本正确执行

## 2. Model Layer

- [x] 2.1 创建 `app/models/skill.py`，定义 SQLAlchemy Model
- [x] 2.2 定义 `SkillLevel` 枚举 (Planning, Functional, Atomic)

## 3. Schema Layer

- [x] 3.1 创建 `app/schemas/skill.py`
- [x] 3.2 定义 `SkillCreate` - 创建技能请求 Schema
- [x] 3.3 定义 `SkillUpdate` - 更新技能请求 Schema
- [x] 3.4 定义 `SkillResponse` - 技能响应 Schema
- [x] 3.5 定义 `SkillListResponse` - 列表响应 Schema（含分页）

## 4. Repository Layer

- [x] 4.1 创建 `app/repositories/skill_repo.py`
- [x] 4.2 实现 `create` 方法
- [x] 4.3 实现 `get_by_code` 方法
- [x] 4.4 实现 `get_by_code_or_none` 方法
- [x] 4.5 实现 `update` 方法
- [x] 4.6 实现 `soft_delete` 方法
- [x] 4.7 实现 `activate` 方法
- [x] 4.8 实现 `deactivate` 方法
- [x] 4.9 实现 `list` 方法（支持分页、筛选）

## 5. Service Layer

- [x] 5.1 创建 `app/services/skill_service.py`
- [x] 5.2 实现 `create_skill` 方法（含 code 唯一性校验）
- [x] 5.3 实现 `get_skill` 方法
- [x] 5.4 实现 `update_skill` 方法（含 code 不可修改校验）
- [x] 5.5 实现 `delete_skill` 方法
- [x] 5.6 实现 `activate_skill` 方法
- [x] 5.7 实现 `deactivate_skill` 方法
- [x] 5.8 实现 `list_skills` 方法

## 6. API Layer

- [x] 6.1 创建 `app/api/v1/skills.py`
- [x] 6.2 实现 `POST /api/v1/skills` - 创建技能
- [x] 6.3 实现 `GET /api/v1/skills` - 获取列表
- [x] 6.4 实现 `GET /api/v1/skills/{code}` - 获取详情
- [x] 6.5 实现 `PUT /api/v1/skills/{code}` - 更新技能
- [x] 6.6 实现 `DELETE /api/v1/skills/{code}` - 软删除
- [x] 6.7 实现 `PATCH /api/v1/skills/{code}/activate` - 启用
- [x] 6.8 实现 `PATCH /api/v1/skills/{code}/deactivate` - 禁用

## 7. Registration

- [x] 7.1 在 API router 中注册 skills 路由
- [x] 7.2 在 `app/api/v1/__init__.py` 添加 skills router

## 8. Testing

- [x] 8.1 验证数据库迁移成功
- [x] 8.2 验证所有 API 端点功能
