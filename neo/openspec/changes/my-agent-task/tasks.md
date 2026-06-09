## 1. Database Migration

- [x] 1.1 删除旧的 task 表 migration 文件
- [x] 1.2 重新创建 task 表 migration（`owner_id` → `creator_id`，新增 `executor_id`，必填）
- [x] 1.3 重新创建 task_record 表 migration（保持不变）
- [x] 1.4 运行 migration 并验证表结构

## 2. Backend - Model & Schema

- [x] 2.1 更新 Task Model（`owner` → `creator`，新增 `executor` relationship）
- [x] 2.2 更新 TaskCreateSchema（新增 `executor_id` 必填字段）
- [x] 2.3 更新 TaskUpdateSchema（保持不变）
- [x] 2.4 更新 TaskResponseSchema（新增 `executor_id`, `executor_name`）
- [x] 2.5 更新 TaskListResponseSchema（新增 `executor_id`, `executor_name`）

## 3. Backend - Repository

- [x] 3.1 更新 TaskRepository（`owner_id` → `creator_id`）
- [x] 3.2 新增 `get_my_tasks` 方法（跨工作区筛选）
- [x] 3.3 新增 `get_my_tasks_filtered` 方法（支持 my_role 筛选）

## 4. Backend - Service

- [x] 4.1 更新 TaskService（`owner_id` → `creator_id`）
- [x] 4.2 新增 `get_my_tasks` 方法
- [x] 4.3 更新 `create_task` 方法（必须指定 executor_id）
- [x] 4.4 更新单元测试

## 5. Backend - API

- [x] 5.1 新增 `GET /api/v1/tasks/me` 端点（我的任务列表）
- [x] 5.2 更新 `POST /api/v1/workspaces/{code}/tasks`（新增 executor_id 参数）
- [x] 5.3 添加 executor_id 参数验证
- [x] 5.4 API 响应示例更新

## 6. Frontend - API Client

- [x] 6.1 更新 `lib/api/task.ts`（`owner_id` → `creator_id`，新增 `executor_id`）
- [x] 6.2 新增 `getMyTasks` 方法（调用 `/api/v1/tasks/me`）

## 7. Frontend - Pages

- [x] 7.1 创建 `/tasks/page.tsx`（我的任务列表页）
- [x] 7.2 更新任务列表页（新增「执行人」列）
- [x] 7.3 更新任务详情页（显示 creator 和 executor）
- [x] 7.4 更新创建任务页（新增「执行人」选择）

## 8. Frontend - Components

- [x] 8.1 新增 TaskListCard 支持 `my_role` 徽章
- [x] 8.2 新增「所属工作区」列（我的任务页）
- [x] 8.3 新增筛选器组件（全部/我创建的/我执行的）
- [x] 8.4 更新 TaskTypes 类型定义

## 9. Frontend - Sidebar

- [x] 9.1 在个人中心侧边栏添加「我的任务」链接

## 10. Code Quality

- [x] 10.1 运行后端单元测试
- [x] 10.2 运行前端 typecheck
- [x] 10.3 运行前端 lint
- [x] 10.4 运行前端 format
- [x] 10.5 Git 提交并推送

## 11. Documentation

- [x] 11.1 同步更新设计文档到主分支（docs: 更新任务管理文档）
