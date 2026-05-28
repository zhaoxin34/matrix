## 1. 数据库设计

- [x] 1.1 创建 `skills` 表（包含 code, name, level, tags, status, draft_snapshot 等字段）
- [x] 1.2 创建 `skill_versions` 表（包含 skill_id, version, file_snapshot, comment 等字段）
- [x] 1.3 创建 `file_metadata` 表（包含 name, path, size 等字段）
- [x] 1.4 创建 `files` 表（包含 file_metadata_id, version, content 等字段）
- [x] 1.5 添加必要的索引和唯一约束

## 2. 后端 API 实现

- [x] 2.1 实现 Skill CRUD API（POST /api/v1/skills）
- [x] 2.2 实现 Skill 列表 API（GET /api/v1/skills，支持分页和筛选）
- [x] 2.3 实现 Skill 详情 API（GET /api/v1/skills/{code}）
- [x] 2.4 实现 Skill 更新 API（PATCH /api/v1/skills/{code}）
- [x] 2.5 实现 Skill 软删除 API（DELETE /api/v1/skills/{code}）

## 3. 文件管理 API

- [x] 3.1 实现获取文件树 API（GET /api/v1/skills/{code}/files）
- [x] 3.2 实现获取文件内容 API（GET /api/v1/skills/{code}/files/{path}）
- [x] 3.3 实现创建文件 API（POST /api/v1/skills/{code}/files）
- [x] 3.4 实现更新文件 API（PUT /api/v1/skills/{code}/files/{path}）
- [x] 3.5 实现删除文件 API（DELETE /api/v1/skills/{code}/files/{path}）

## 4. 版本管理 API

- [x] 4.1 实现发布 Skill API（POST /api/v1/skills/{code}/publish）
- [x] 4.2 实现获取版本历史 API（GET /api/v1/skills/{code}/versions）
- [x] 4.3 实现回滚 Skill API（POST /api/v1/skills/{code}/rollback）

## 5. 状态管理 API

- [x] 5.1 实现禁用 Skill API（POST /api/v1/skills/{code}/disable）
- [x] 5.2 实现启用 Skill API（POST /api/v1/skills/{code}/enable）

## 6. 权限控制

- [ ] 6.1 实现基于角色的权限检查中间件
- [ ] 6.2 实现所有者权限检查（create_user_id 匹配）
- [ ] 6.3 在所有 API 中集成权限检查

## 7. 前端页面开发

- [x] 7.1 开发 Skills 列表页（/admin/skills）
- [x] 7.2 开发 Skill 详情页（/skills/{code}）
- [x] 7.3 实现文件树组件
- [x] 7.4 实现文件编辑器组件
- [x] 7.5 实现版本历史弹窗
- [x] 7.6 实现发布/回滚功能

## 8. 路由配置

- [x] 8.1 在 routing-table.md 中添加 Skills 相关路由
- [ ] 8.2 配置前端路由守卫（权限控制）

## 9. 测试

- [x] 9.1 编写单元测试（tests/unit/test_skill_service.py）
- [ ] 9.2 编写 E2E 测试用例
- [ ] 9.3 创建测试页面对象（skills_page.py）
- [ ] 9.4 实现核心场景测试
