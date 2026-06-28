# Interceptor CRUD 实现任务清单

## 1. 数据库迁移

- [ ] 1.1 创建 Alembic 迁移文件 `interceptors` 表
- [ ] 1.2 定义字段：id, workspace_id, embedded_site_id, name, event_name, mode, entity_name, target_entity_name, trigger_type, trigger, before_actions, after_actions, page_url_pattern, debounce_ms, status, created_at, updated_at, created_by

## 2. Backend Model

- [ ] 2.1 创建 `Interceptor` 模型类
- [ ] 2.2 添加外键关系：workspace, embedded_site, creator
- [ ] 2.3 更新 `models/__init__.py` 导出 Interceptor

## 3. Backend Schema

- [ ] 3.1 创建 `InterceptorCreate` schema
- [ ] 3.2 创建 `InterceptorUpdate` schema
- [ ] 3.3 创建 `InterceptorResponse` schema
- [ ] 3.4 创建 `InterceptorListResponse` schema
- [ ] 3.5 创建 trigger JSON 校验逻辑

## 4. Backend Repository

- [ ] 4.1 创建 `InterceptorRepository` 类
- [ ] 4.2 实现 CRUD 方法：create, get_by_id, list, update, soft_delete
- [ ] 4.3 实现 enable/disable 方法
- [ ] 4.4 实现按 embedded_site_id 过滤

## 5. Backend API

- [ ] 5.1 创建 `POST /api/v1/workspaces/{workspace_code}/interceptors`
- [ ] 5.2 创建 `GET /api/v1/workspaces/{workspace_code}/interceptors`
- [ ] 5.3 创建 `GET /api/v1/workspaces/{workspace_code}/interceptors/{id}`
- [ ] 5.4 创建 `PUT /api/v1/workspaces/{workspace_code}/interceptors/{id}`
- [ ] 5.5 创建 `DELETE /api/v1/workspaces/{workspace_code}/interceptors/{id}`
- [ ] 5.6 创建 `POST /api/v1/workspaces/{workspace_code}/interceptors/{id}/enable`
- [ ] 5.7 创建 `POST /api/v1/workspaces/{workspace_code}/interceptors/{id}/disable`

## 6. Backend 测试

- [ ] 6.1 编写 Interceptor API 集成测试（参考 test_event_api.py）
- [ ] 6.2 测试用例：创建、列表、详情、更新、删除、启用、禁用
- [ ] 6.3 测试边界条件：invalid site_id, invalid trigger, missing entity_name

## 7. Frontend Types

- [ ] 7.1 创建 `frontend/components/interceptor/interceptor-types.ts`
- [ ] 7.2 定义 Interceptor 接口

## 8. Frontend API Client

- [ ] 8.1 创建 `frontend/lib/api/interceptors.ts`
- [ ] 8.2 实现 CRUD API 调用函数

## 9. Frontend Components

- [ ] 9.1 创建 `interceptor-header.tsx`（页面头部 + 创建按钮）
- [ ] 9.2 创建 `interceptor-list.tsx`（列表 + 分页 + site 筛选）
- [ ] 9.3 创建 `interceptor-card.tsx`（卡片展示）
- [ ] 9.4 创建 `interceptor-form.tsx`（创建/编辑表单）
- [ ] 9.5 创建 `interceptor-detail.tsx`（详情展示）
- [ ] 9.6 创建 `index.ts` 导出

## 10. Frontend Pages

- [ ] 10.1 创建 `app/(main)/workspace/[workspace_code]/interceptors/page.tsx`（列表页）
- [ ] 10.2 创建 `app/(main)/workspace/[workspace_code]/interceptors/[id]/page.tsx`（详情页）
- [ ] 10.3 创建 `app/(main)/workspace/[workspace_code]/interceptors/new/page.tsx`（创建页）
- [ ] 10.4 创建 `app/(main)/workspace/[workspace_code]/interceptors/[id]/edit/page.tsx`（编辑页）

## 11. Frontend 导航

- [ ] 11.1 更新 `sidebar-content.tsx` 添加 Interceptors 菜单项
- [ ] 11.2 添加 `/workspace/{workspace_code}/interceptors` 路由

## 12. E2E 测试

- [ ] 12.1 创建 `e2e-test/workspaces/interceptor-test-cases.md`
- [ ] 12.2 编写 CRUD 功能测试用例
- [ ] 12.3 编写边界条件测试用例

## 13. 文档更新

- [ ] 13.1 更新路由表版本号
- [ ] 13.2 确认产品文档和技术文档一致性
