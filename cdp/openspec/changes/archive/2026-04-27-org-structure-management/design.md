## 背景

CDP 平台目前已具备用户认证（JWT）、客户数据管理等基础能力，采用 FastAPI + SQLAlchemy 2.0 后端、React + Ant Design 前端的分层架构。本次新增组织架构管理模块，为平台提供统一的组织数据基础，支撑后续的权限控制和 OA 审批集成。

当前后端遵循 `api/v1 → services → repositories → models` 的四层结构，新模块完全沿用此约定。

## Goals / Non-Goals

**Goals:**
- 实现组织单元（最多 4 级）的树形 CRUD 管理
- 实现员工档案管理，支持主/辅部门归属
- 实现员工部门调动与调动历史记录
- 基于 Closure Table 实现层级权限范围控制
- 提供组织与员工统计看板接口
- 员工批量 Excel 导入/导出

**Non-Goals:**
- 审批流 OA 系统的具体实现（本次仅预留触发接口，OA 集成为 P1）
- HRM 系统数据同步（P2）
- 前端拖拽调整组织节点（P1，当前仅通过 API 移动）
- 组织合并功能（P1）

## Decisions

### 决策 1：使用 Closure Table 存储层级关系

**选择**：新增 `org_unit_closure` 表，存储所有祖先-后代关系对（含自身，depth=0）。

**理由**：组织权限查询频繁需要"获取某节点所有后代"，Closure Table 将此操作降为单次 `WHERE ancestor_id = ?` 查询，避免递归 CTE 或应用层遍历。相比邻接表（adjacency list）读性能更优；相比路径枚举（path enumeration）更易维护。

**代价**：写入时需同步维护闭包表（插入/移动时需批量 upsert），逻辑稍复杂，封装在 `OrgUnitRepository` 中。

**备选方案**：MySQL 8.0 递归 CTE（WITH RECURSIVE）— 无需额外表，但复杂查询性能不稳定，且每次权限检查都需完整树遍历，放弃。

---

### 决策 2：权限范围在 Repository 层注入，不在业务层过滤

**选择**：所有涉及组织或员工的查询，在 Repository 方法签名中接收 `permitted_unit_ids: list[int]`，由 SQL 的 `WHERE unit_id IN (...)` 完成数据隔离。

**理由**：在数据库层过滤避免"先全量加载再内存过滤"的安全漏洞，且性能更好。`permitted_unit_ids` 由 `OrgPermissionService` 基于当前用户角色和 Closure Table 计算，作为依赖注入传入。

**备选方案**：在 Service 层获取全量数据后按权限过滤 — 存在数据泄露风险（分页逻辑不一致），放弃。

---

### 决策 3：User 与 Employee 解耦，通过关联表绑定（One-to-Zero-or-One）

**选择**：新增 `user_employee_mapping` 关联表，将系统账号（`users`）与员工档案（`employees`）解耦。

```
users (1) ←→ (0..1) user_employee_mapping (1) ←→ (1) employees
```

**数据模型**：
```
user_employee_mapping
├── id: bigint, PK
├── user_id: bigint, FK → users.id, UNIQUE   # 一个 user 最多对应一个员工
├── employee_id: bigint, FK → employees.id, UNIQUE  # 一个员工最多对应一个 user
└── created_at: datetime
```

**理由**：
- `users` 表是**认证账号**（登录凭证、密码、锁定状态），不承载业务语义
- `employees` 表是**员工档案**（组织归属、岗位、调动历史），不依赖登录系统
- 解耦后两者可独立变化：员工可先建档（待入职状态）后绑定账号；账号可以存在而不对应任何员工（如纯管理员账号）
- 通过关联表而非直接在 `employees` 加 `user_id` 外键，避免 `employees` 强依赖 `users`

**创建员工的约束**：
- 绑定账号时，只能从 `users` 表中选择尚未在 `user_employee_mapping` 中存在的 user（即未绑定员工的账号）
- 员工档案本身可不绑定 user（如外部合作人员或待入职员工）
- 一旦绑定，通过 `UNIQUE` 约束在数据库层保证 1:1

**备选方案**：在 `employees` 表直接加 `user_id` 可空外键 — 直接耦合，难以在不修改 `employees` 表结构的情况下扩展账号体系，放弃。

---

### 决策 4：员工删除采用软删除（状态机）

**选择**：删除员工不物理删除记录，而是将 `status` 设为 `offboarding` 并记录 `dimission_date`。

**理由**：员工调动历史、审批记录等需要引用历史员工数据，物理删除会造成外键断裂。调动历史具有审计价值，必须保留。

---

### 决策 4：后端模块拆分为独立路由文件

**选择**：
```
backend/src/app/
├── api/v1/
│   ├── org_units.py      # 组织单元路由
│   └── employees.py      # 员工路由（含调动、导入导出）
├── models/
│   ├── org_unit.py
│   ├── org_unit_closure.py
│   ├── employee.py
│   ├── employee_secondary_unit.py
│   ├── employee_transfer.py
│   └── user_employee_mapping.py
├── schemas/
│   ├── org_unit.py
│   └── employee.py
├── services/
│   ├── org_unit_service.py
│   ├── employee_service.py
│   └── org_permission_service.py
└── repositories/
    ├── org_unit_repo.py
    └── employee_repo.py
```

**理由**：沿用现有分层约定，每个功能域独立文件，便于团队并行开发和后续维护。

---

### 决策 5：Excel 导入使用 openpyxl，导出使用流式响应

**选择**：导入用 `openpyxl` 解析上传文件，逐行验证后批量插入；导出用 `StreamingResponse` 返回 Excel 字节流，避免大文件内存压力。

**理由**：`openpyxl` 是 Python 生态主流 Excel 库，无需 LibreOffice 等外部依赖。

---

### 决策 6：前端新增独立页面模块

**选择**：
```
frontend/src/pages/
├── OrgStructure.tsx        # 组织架构树形视图 + 员工列表
frontend/src/api/modules/
├── orgUnit.ts
└── employee.ts
frontend/src/types/
├── orgUnit.ts
└── employee.ts
```

**理由**：沿用现有页面 + API 模块 + 类型分离的前端约定。树形组件使用 Ant Design `Tree`，员工列表使用 `Table`，Modal 用于新增/编辑表单。

## Risks / Trade-offs

- **Closure Table 写入开销** → 组织移动时需批量重建闭包条目，若组织规模极大（>10000节点）可能较慢。MVP 阶段面向中型企业（200-2000人），组织节点数通常 <200，可接受。后续可引入异步任务优化。
- **permitted_unit_ids 列表过长** → 权限范围内单元数量过多时，`IN (...)` 查询性能下降。可通过 `WITH RECURSIVE` 子查询或 Redis 缓存权限集合优化（暂不实现）。
- **Excel 导入无事务回滚** → 批量导入采用"逐行处理，错误跳过"策略，部分成功。若需全量原子性可改为全量校验后再写入，但会增加内存消耗，暂按 PRD 需求实现部分导入。
- **OA 审批集成预留** → 本期调动触发 OA 的接口以 stub 形式实现（记录调动记录但不实际调用外部系统），P1 阶段补充真实集成。

## Migration Plan

1. 编写 Alembic 迁移文件，创建 6 张新表（`organization_unit`、`org_unit_closure`、`employee`、`employee_secondary_unit`、`employee_transfer`、`user_employee_mapping`）
2. 在 `main.py` 注册新路由 `/api/v1/org/units` 和 `/api/v1/employees`
3. 前端新增路由 `/org` 指向 `OrgStructure.tsx`，在导航菜单中添加入口
4. 无需数据迁移（全新功能，无历史数据）
5. 回滚：删除新路由注册 + 执行 Alembic downgrade

## Open Questions

- 组织架构页面是否需要分权限的导航菜单显示/隐藏？（当前设计为前端统一展示，由后端 API 做数据隔离）
- OA 审批系统的接口协议尚未确认，P1 阶段需补充具体集成方案
- 员工批量导入的 Excel 模板格式需与产品确认列顺序和必填字段
