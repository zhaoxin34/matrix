## 1. 数据库迁移

- [x] 1.1 创建 Alembic 迁移文件：新增 `organization_unit` 表（id, name, code, type, parent_id, level, status, sort_order, leader_id, created_at, updated_at）
- [x] 1.2 创建 Alembic 迁移文件：新增 `org_unit_closure` 表（ancestor_id, descendant_id, depth），建立联合主键和索引
- [x] 1.3 创建 Alembic 迁移文件：新增 `employee` 表（id, employee_no, name, phone, email, position, primary_unit_id, status, entry_date, dimission_date, created_at, updated_at）
- [x] 1.4 创建 Alembic 迁移文件：新增 `employee_secondary_unit` 表（id, employee_id, unit_id, created_at）
- [x] 1.5 创建 Alembic 迁移文件：新增 `employee_transfer` 表（id, employee_id, from_unit_id, to_unit_id, transfer_type, effective_date, reason, created_at）
- [x] 1.6 创建 Alembic 迁移文件：新增 `user_employee_mapping` 表（id, user_id UNIQUE, employee_id UNIQUE, created_at）
- [x] 1.7 执行 `make migrate` 验证迁移成功

## 2. 后端 Models

- [x] 2.1 创建 `backend/src/app/models/org_unit.py`：定义 `OrganizationUnit` SQLAlchemy 模型
- [x] 2.2 创建 `backend/src/app/models/org_unit_closure.py`：定义 `OrgUnitClosure` 模型
- [x] 2.3 创建 `backend/src/app/models/employee.py`：定义 `Employee` 模型，status enum 包含 onboarding/on_job/transferring/offboarding
- [x] 2.4 创建 `backend/src/app/models/employee_secondary_unit.py`：定义 `EmployeeSecondaryUnit` 模型
- [x] 2.5 创建 `backend/src/app/models/employee_transfer.py`：定义 `EmployeeTransfer` 模型，transfer_type enum 包含 promotion/demotion/transfer
- [x] 2.6 创建 `backend/src/app/models/user_employee_mapping.py`：定义 `UserEmployeeMapping` 模型
- [x] 2.7 在 `backend/src/app/models/__init__.py` 中注册所有新模型

## 3. 后端 Schemas（Pydantic）

- [x] 3.1 创建 `backend/src/app/schemas/org_unit.py`：定义 OrgUnitCreate、OrgUnitUpdate、OrgUnitResponse、OrgTreeNode（含 member_count、total_member_count、children）
- [x] 3.2 创建 `backend/src/app/schemas/employee.py`：定义 EmployeeCreate、EmployeeUpdate、EmployeeResponse、EmployeeTransferCreate、TransferHistoryResponse

## 4. 后端 Repositories

- [x] 4.1 创建 `backend/src/app/repositories/org_unit_repo.py`：实现 create、update、delete、get_by_id、get_tree，以及 Closure Table 的 insert_closure、rebuild_closure（用于移动）
- [x] 4.2 在 `org_unit_repo.py` 中实现 move_unit：校验循环引用、删除旧闭包条目、重建新闭包条目
- [x] 4.3 创建 `backend/src/app/repositories/employee_repo.py`：实现 create、update、get_by_id、list（支持 unit_id 过滤含后代、status 过滤、keyword 搜索、permitted_unit_ids 注入）
- [x] 4.4 在 `employee_repo.py` 中实现辅属部门的 add_secondary_unit、remove_secondary_unit
- [x] 4.5 在 `employee_repo.py` 中实现 create_transfer、list_transfers

## 5. 后端 Services

- [x] 5.1 创建 `backend/src/app/services/org_permission_service.py`：根据当前用户角色和 org_unit_closure 计算 permitted_unit_ids
- [x] 5.2 创建 `backend/src/app/services/org_unit_service.py`：实现组织单元 CRUD、禁用/启用、移动，调用 repo 并注入权限范围
- [x] 5.3 创建 `backend/src/app/services/employee_service.py`：实现员工档案 CRUD、软删除（状态 → offboarding）、辅属部门管理、user_employee_mapping 绑定/解绑
- [x] 5.4 在 `employee_service.py` 中实现发起调动：创建 transfer 记录、更新员工状态为 transferring、判断是否跨部门（stub：记录日志，不实际调用 OA）
- [x] 5.5 在 `employee_service.py` 中实现批量 Excel 导入：解析 openpyxl、逐行校验、批量写入、返回汇总报告
- [x] 5.6 在 `employee_service.py` 中实现 Excel 导出：构建 openpyxl workbook，以 StreamingResponse 返回

## 6. 后端 API 路由

- [x] 6.1 创建 `backend/src/app/api/v1/org_units.py`：注册以下路由并连接 service
  - GET /api/v1/org/units
  - GET /api/v1/org/units/{id}
  - POST /api/v1/org/units
  - PUT /api/v1/org/units/{id}
  - DELETE /api/v1/org/units/{id}
  - PATCH /api/v1/org/units/{id}/status（禁用/启用）
  - PATCH /api/v1/org/units/{id}/move
- [x] 6.2 创建 `backend/src/app/api/v1/employees.py`：注册以下路由并连接 service
  - GET /api/v1/employees
  - GET /api/v1/employees/{id}
  - POST /api/v1/employees
  - PUT /api/v1/employees/{id}
  - DELETE /api/v1/employees/{id}
  - POST /api/v1/employees/{id}/secondary-units
  - DELETE /api/v1/employees/{id}/secondary-units/{unit_id}
  - POST /api/v1/employees/{id}/bind-user
  - DELETE /api/v1/employees/{id}/bind-user
  - POST /api/v1/employees/transfer
  - GET /api/v1/employees/{id}/transfers
  - POST /api/v1/employees/import
  - GET /api/v1/employees/export
- [x] 6.3 在 `backend/src/app/api/v1/employees.py` 新增看板统计路由：GET /api/v1/org/dashboard
- [x] 6.4 在 `backend/src/app/main.py` 中注册 org_units 和 employees 两个路由器

## 7. 前端 API 模块与类型

- [x] 7.1 创建 `frontend/src/types/orgUnit.ts`：定义 OrgUnit、OrgTreeNode、CreateOrgUnitPayload、MoveOrgUnitPayload 等类型
- [x] 7.2 创建 `frontend/src/types/employee.ts`：定义 Employee、EmployeeTransfer、CreateEmployeePayload、TransferPayload 等类型
- [x] 7.3 创建 `frontend/src/api/modules/orgUnit.ts`：封装组织单元相关 Axios 请求
- [x] 7.4 创建 `frontend/src/api/modules/employee.ts`：封装员工相关 Axios 请求（含导入/导出）

## 8. 前端页面

- [x] 8.1 创建 `frontend/src/pages/OrgStructure.tsx`：整体页面布局（左侧树形视图 + 右侧员工列表）
- [x] 8.2 实现左侧组织树：使用 Ant Design Tree 展示组织层级，支持折叠/展开，节点显示员工数量
- [x] 8.3 实现组织树操作：点击节点右键菜单（或操作按钮）触发新增子组织、编辑、禁用/删除、移动
- [x] 8.4 实现新增/编辑组织 Modal：表单字段包含名称、编码、类型、负责人
- [x] 8.5 实现右侧员工列表：Ant Design Table，支持按部门筛选（选中树节点联动）、状态筛选、关键词搜索
- [x] 8.6 实现新增/编辑员工 Modal：表单字段包含工号、姓名、手机、邮箱、岗位、主属部门、入职日期，可选绑定系统账号
- [x] 8.7 实现员工详情抽屉（Drawer）：显示完整员工信息 + 调动历史列表
- [x] 8.8 实现发起调动 Modal：选择目标部门、生效日期、调动类型、填写原因
- [x] 8.9 实现 Excel 导入：Upload 组件上传文件，展示导入结果（成功数 + 错误行列表）
- [x] 8.10 实现 Excel 导出：点击导出按钮触发文件下载
- [x] 8.11 实现页面顶部统计看板：展示组织总数、员工总数、在职员工、待入职员工四项指标
- [x] 8.12 在路由配置中添加 `/org` 路由指向 OrgStructure 页面，并在导航菜单中添加入口
