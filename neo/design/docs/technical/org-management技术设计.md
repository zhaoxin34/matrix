---
id: org-management
title: 组织管理技术设计
author: Joky.Zhao
created: 2026-05-13
updated: 2026-05-13
version: 1.0.0
tags: [技术设计, 组织管理]
---

> 📄 本文档为组织管理技术设计文档，完整的产品设计请参见 [组织管理设计](../product/admin/org-management)

---

## 🎨 API 设计

### 1.1 组织 API

#### 获取组织树

**端点**：`GET /api/v1/org/units`

**查询参数**：
| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `status` | enum | 按状态过滤 (`active`, `inactive`) |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "name": "Matrix公司",
      "type": "company",
      "level": 0,
      "children": [
        {
          "id": 2,
          "name": "北京研发部",
          "type": "branch",
          "level": 1,
          "children": []
        }
      ]
    }
  ],
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

#### 创建组织

**端点**：`POST /api/v1/org/units`

**请求体**：

```json
{
  "name": "北京研发部",
  "type": "branch",
  "parent_id": 1
}
```

**约束**：

- 层级深度最多 4 级
- 名称在同一父级下唯一

#### 编辑组织

**端点**：`PUT /api/v1/org/units/{id}`

**请求体**：

```json
{
  "name": "北京研发中心",
  "sort_order": 10
}
```

#### 删除组织

**端点**：`DELETE /api/v1/org/units/{id}`

**约束**：

- 需校验是否有子组织
- 需校验是否有员工归属

#### 移动组织

**端点**：`PUT /api/v1/org/units/{id}/move`

**请求体**：

```json
{
  "parent_id": 3
}
```

**说明**：移动时会自动更新闭包表 (org_unit_closure)。

### 1.2 员工 API

#### 获取员工列表

**端点**：`GET /api/v1/employees`

**查询参数**：
| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `unit_id` | int | 按组织单元过滤 |
| `status` | enum | 按状态过滤 |
| `page` | int | 页码，默认 1 |
| `page_size` | int | 每页数量，默认 20 |
| `search` | string | 搜索姓名/工号 |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "list": [
      {
        "id": 1,
        "name": "张三",
        "employee_no": "001",
        "phone": "13800138001",
        "email": "zhang@qq.com",
        "position": "工程师",
        "primary_unit": {
          "id": 2,
          "name": "北京研发部-前端组"
        },
        "secondary_units": [
          {
            "id": 5,
            "name": "前端架构组"
          }
        ],
        "status": "on_job",
        "entry_date": "2026-05-13"
      }
    ]
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

#### 创建员工

**端点**：`POST /api/v1/employees`

**请求体**：

```json
{
  "name": "张三",
  "employee_no": "001",
  "phone": "13800138001",
  "email": "zhang@qq.com",
  "position": "工程师",
  "primary_unit_id": 2,
  "entry_date": "2026-05-13",
  "secondary_unit_ids": [5, 6]
}
```

**说明**：`secondary_unit_ids` 为可选，指定辅助部门。

#### 编辑员工

**端点**：`PUT /api/v1/employees/{id}`

#### 删除员工（软删除）

**端点**：`DELETE /api/v1/employees/{id}`

**说明**：软删除将 `status` 设为 `offboarding`，记录 `dimission_date`。

#### 调动员工

**端点**：`PUT /api/v1/employees/{id}/transfer`

**请求体**：

```json
{
  "to_unit_id": 3,
  "transfer_type": "transfer",
  "effective_date": "2026-06-01",
  "reason": "岗位调整"
}
```

**说明**：调动时记录历史到 `employee_transfer` 表。

#### 批量导入

**端点**：`POST /api/v1/employees/import`

**请求**：multipart/form-data，上传 Excel 文件

**Excel 模板**：
| 工号 | 姓名 | 手机号 | 邮箱 | 主部门 | 岗位 | 入职日期 | 辅助部门 |
| ---- | ---- | ------ | ---- | ------ | ---- | -------- | -------- |
| 001 | 张三 | 138... | zhang@ | 北京研发-前端 | 工程师 | 2026-05-13 | 前端架构组 |

#### 批量导出

**端点**：`GET /api/v1/employees/export`

**查询参数**：同获取员工列表，用于筛选导出的员工范围

---

## 🗄️ 数据库设计

### 2.1 组织单元表 (organization_unit)

| 字段         | 类型         | 约束                      | 说明                                     |
| ------------ | ------------ | ------------------------- | ---------------------------------------- |
| `id`         | BIGINT       | PK, AUTO_INCREMENT        | 自增主键                                 |
| `name`       | VARCHAR(100) | NOT NULL                  | 组织名称                                 |
| `code`       | VARCHAR(50)  | UNIQUE, NOT NULL          | 组织编码                                 |
| `type`       | ENUM         | NOT NULL                  | company/branch/department/sub_department |
| `parent_id`  | BIGINT       | FK → organization_unit.id | 父组织 ID                                |
| `level`      | INT          | NOT NULL, DEFAULT 0       | 层级深度                                 |
| `sort_order` | INT          | NOT NULL, DEFAULT 0       | 排序顺序                                 |
| `leader_id`  | INT          | FK → users.id             | 负责人用户 ID                            |
| `status`     | ENUM         | DEFAULT 'active'          | active / inactive                        |
| `created_at` | DATETIME     | NOT NULL                  | 创建时间                                 |
| `updated_at` | DATETIME     | NOT NULL                  | 更新时间                                 |

### 2.2 组织单元闭包表 (org_unit_closure)

| 字段            | 类型   | 约束                          | 说明        |
| --------------- | ------ | ----------------------------- | ----------- |
| `ancestor_id`   | BIGINT | FK → organization_unit.id, PK | 祖先节点 ID |
| `descendant_id` | BIGINT | FK → organization_unit.id, PK | 后代节点 ID |
| `depth`         | INT    | NOT NULL                      | 深度        |

### 2.3 员工表 (employee)

| 字段              | 类型         | 约束                      | 说明                                       |
| ----------------- | ------------ | ------------------------- | ------------------------------------------ |
| `id`              | BIGINT       | PK, AUTO_INCREMENT        | 自增主键                                   |
| `employee_no`     | VARCHAR(50)  | UNIQUE, NOT NULL          | 工号                                       |
| `name`            | VARCHAR(100) | NOT NULL                  | 员工姓名                                   |
| `phone`           | VARCHAR(20)  | -                         | 手机号                                     |
| `email`           | VARCHAR(100) | -                         | 邮箱                                       |
| `position`        | VARCHAR(100) | -                         | 岗位名称                                   |
| `primary_unit_id` | BIGINT       | FK → organization_unit.id | 主属组织单元                               |
| `status`          | ENUM         | DEFAULT 'onboarding'      | onboarding/on_job/transferring/offboarding |
| `entry_date`      | DATE         | -                         | 入职日期                                   |
| `dimission_date`  | DATE         | -                         | 离职日期                                   |
| `created_at`      | DATETIME     | NOT NULL                  | 创建时间                                   |
| `updated_at`      | DATETIME     | NOT NULL                  | 更新时间                                   |

### 2.4 员工辅助部门表 (employee_secondary_unit)

| 字段          | 类型     | 约束                                | 说明        |
| ------------- | -------- | ----------------------------------- | ----------- |
| `id`          | BIGINT   | PK, AUTO_INCREMENT                  | 自增主键    |
| `employee_id` | BIGINT   | FK → employee.id, NOT NULL          | 员工 ID     |
| `unit_id`     | BIGINT   | FK → organization_unit.id, NOT NULL | 组织单元 ID |
| `created_at`  | DATETIME | NOT NULL                            | 创建时间    |

**约束**：employee_id + unit_id 联合唯一

### 2.5 员工调动记录表 (employee_transfer)

| 字段             | 类型         | 约束                                | 说明                        |
| ---------------- | ------------ | ----------------------------------- | --------------------------- |
| `id`             | BIGINT       | PK, AUTO_INCREMENT                  | 自增主键                    |
| `employee_id`    | BIGINT       | FK → employee.id, NOT NULL          | 员工 ID                     |
| `from_unit_id`   | BIGINT       | FK → organization_unit.id           | 原部门                      |
| `to_unit_id`     | BIGINT       | FK → organization_unit.id, NOT NULL | 新部门                      |
| `transfer_type`  | ENUM         | NOT NULL                            | promotion/demotion/transfer |
| `effective_date` | DATE         | NOT NULL                            | 生效日期                    |
| `reason`         | VARCHAR(500) | -                                   | 调动原因                    |
| `created_at`     | DATETIME     | NOT NULL                            | 创建时间                    |

### 2.6 用户员工关联表 (user_employee_mapping)

| 字段          | 类型     | 约束                               | 说明     |
| ------------- | -------- | ---------------------------------- | -------- |
| `id`          | BIGINT   | PK, AUTO_INCREMENT                 | 自增主键 |
| `user_id`     | INT      | FK → users.id, UNIQUE, NOT NULL    | 用户 ID  |
| `employee_id` | BIGINT   | FK → employee.id, UNIQUE, NOT NULL | 员工 ID  |
| `created_at`  | DATETIME | NOT NULL                           | 创建时间 |

---

## 🔗 相关文档

- [ 组织管理设计 ](../product/admin/org-management)
- [ 用户管理技术设计 ](../technical/user-management)
