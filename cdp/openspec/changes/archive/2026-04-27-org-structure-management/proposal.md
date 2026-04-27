## Why

企业缺乏统一的组织架构数据源，导致部门信息散落在各系统中形成信息孤岛，无法支撑基于组织结构的权限控制和 OA 审批链路。需要构建完整的组织架构管理模块，支持多层级树形结构、员工管理与部门调动，作为 CDP 平台的组织数据基础。

## What Changes

- 新增组织单元（OrganizationUnit）的树形 CRUD 管理，支持 4 级层级（集团 → 分公司 → 一级部门 → 二级部门）
- 新增员工（Employee）档案管理，支持主部门 + 多辅部门归属
- 新增员工部门调动功能，记录调动历史并触发审批流
- 新增基于组织层级的权限控制，使用 Closure Table 实现数据隔离
- 新增组织与员工统计看板（组织数、员工总数、在职/待入职统计）
- 新增员工批量导入/导出（Excel）功能

## Capabilities

### New Capabilities

- `org-unit-management`: 组织单元 CRUD、树形展示、拖拽排序、禁用/启用、移动组织节点
- `employee-management`: 员工档案 CRUD、主/辅部门归属、状态管理、批量导入/导出
- `employee-transfer`: 部门调动发起、调动历史记录、审批流集成
- `org-permission`: 基于组织层级的查看/编辑权限控制，Closure Table 数据隔离
- `org-dashboard`: 组织单元数量、员工总数、在职员工、待入职员工统计看板

### Modified Capabilities

（无现有 spec 需变更）

## Impact

- **数据库**: 新增表 `organization_unit`、`org_unit_closure`（Closure Table）、`employee`、`employee_secondary_unit`、`employee_transfer`
- **API**: 新增 `/api/v1/org/units/*` 和 `/api/v1/employees/*` 路由
- **前端**: 新增组织架构管理页面（树形视图 + 员工列表），使用 Ant Design Tree 组件
- **依赖**: 审批流集成（P1，员工调动触发 OA 审批）
