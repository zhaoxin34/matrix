---
id: org-management
title: 组织管理技术设计
author: Joky.Zhao
created: 2026-05-13
updated: 2026-05-13
version: 1.0.0
tags: [技术设计, 组织管理]
---

> 📄 本文档为组织管理技术设计文档，完整的产品设计请参见 [组织管理设计](../product/org-management)

---

## 🎨 API 设计

### 1.1 组织 API

#### 获取组织树

**端点**：`GET /api/v1/org/units`

**查询参数**：
| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `status` | enum | 按状态过滤 (`active`, `disabled`) |

**响应**：

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "org_001",
      "name": "Matrix公司",
      "level": 1,
      "children": [
        {
          "id": "org_002",
          "name": "北京研发部",
          "level": 2,
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
  "parent_id": "org_001"
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
  "name": "北京研发中心"
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
  "parent_id": "org_003"
}
```

### 1.2 员工 API

#### 获取员工列表

**端点**：`GET /api/v1/employees`

**查询参数**：
| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `unit_id` | UUID | 按组织单元过滤 |
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
        "id": "emp_001",
        "name": "张三",
        "employee_no": "001",
        "job_title": "工程师",
        "primary_unit": {
          "id": "org_002",
          "name": "北京研发部-前端组"
        },
        "status": "active"
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
  "primary_unit_id": "org_002",
  "job_title": "工程师",
  "join_date": "2026-05-13"
}
```

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
  "primary_unit_id": "org_003",
  "reason": "岗位调整"
}
```

**说明**：调动时记录历史到 `employee_transfer` 表。

#### 批量导入

**端点**：`POST /api/v1/employees/import`

**请求**：multipart/form-data，上传 Excel 文件

**Excel 模板**：
| 工号 | 姓名 | 主部门 | 岗位 | 入职日期 |
| ---- | ---- | ------ | ---- | -------- |
| 001 | 张三 | 北京研发-前端 | 工程师 | 2026-05-13 |

#### 批量导出

**端点**：`GET /api/v1/employees/export`

**查询参数**：同获取员工列表，用于筛选导出的员工范围

---

## 🗄️ 数据库设计

### 2.1 组织单元表 (organization_unit)

| 字段         | 类型         | 约束                      | 说明           |
| ------------ | ------------ | ------------------------- | -------------- |
| `id`         | UUID         | PK                        | 全局唯一标识符 |
| `name`       | VARCHAR(50)  | NOT NULL                  | 组织名称       |
| `code`       | VARCHAR(50)  | UNIQUE                    | 组织编码       |
| `parent_id`  | UUID         | FK → organization_unit.id | 父组织 ID      |
| `level`      | INT          | NOT NULL                  | 层级深度 1-4   |
| `path`       | VARCHAR(255) | -                         | 路径枚举       |
| `status`     | ENUM         | DEFAULT 'active'          | 状态           |
| `created_at` | DATETIME     | NOT NULL                  | 创建时间       |
| `updated_at` | DATETIME     | NOT NULL                  | 更新时间       |

### 2.2 组织单元闭包表 (org_unit_closure)

| 字段            | 类型 | 约束     | 说明        |
| --------------- | ---- | -------- | ----------- |
| `ancestor_id`   | UUID | FK, PK   | 祖先节点 ID |
| `descendant_id` | UUID | FK, PK   | 后代节点 ID |
| `depth`         | INT  | NOT NULL | 深度        |

### 2.3 员工表 (employees)

| 字段              | 类型        | 约束                      | 说明           |
| ----------------- | ----------- | ------------------------- | -------------- |
| `id`              | UUID        | PK                        | 全局唯一标识符 |
| `name`            | VARCHAR(50) | NOT NULL                  | 员工姓名       |
| `employee_no`     | VARCHAR(50) | UNIQUE                    | 工号           |
| `primary_unit_id` | UUID        | FK → organization_unit.id | 主属组织单元   |
| `job_title`       | VARCHAR(50) | -                         | 岗位名称       |
| `status`          | ENUM        | DEFAULT 'onboarding'      | 状态           |
| `join_date`       | DATE        | -                         | 入职日期       |
| `dimission_date`  | DATE        | -                         | 离职日期       |
| `created_at`      | DATETIME    | NOT NULL                  | 创建时间       |
| `updated_at`      | DATETIME    | NOT NULL                  | 更新时间       |

### 2.4 员工辅助部门表 (employee_secondary_unit)

| 字段          | 类型     | 约束                      | 说明           |
| ------------- | -------- | ------------------------- | -------------- |
| `id`          | UUID     | PK                        | 全局唯一标识符 |
| `employee_id` | UUID     | FK → employees.id         | 员工 ID        |
| `unit_id`     | UUID     | FK → organization_unit.id | 组织单元 ID    |
| `created_at`  | DATETIME | NOT NULL                  | 创建时间       |

### 2.5 员工调动记录表 (employee_transfer)

| 字段           | 类型         | 约束                      | 说明           |
| -------------- | ------------ | ------------------------- | -------------- |
| `id`           | UUID         | PK                        | 全局唯一标识符 |
| `employee_id`  | UUID         | FK → employees.id         | 员工 ID        |
| `from_unit_id` | UUID         | FK → organization_unit.id | 原部门         |
| `to_unit_id`   | UUID         | FK → organization_unit.id | 新部门         |
| `reason`       | VARCHAR(255) | -                         | 调动原因       |
| `operator_id`  | UUID         | FK → users.id             | 操作人         |
| `created_at`   | DATETIME     | NOT NULL                  | 调动时间       |

### 2.6 用户员工关联表 (user_employee_mapping)

| 字段          | 类型     | 约束                      | 说明           |
| ------------- | -------- | ------------------------- | -------------- |
| `id`          | UUID     | PK                        | 全局唯一标识符 |
| `user_id`     | UUID     | FK → users.id, UNIQUE     | 用户 ID        |
| `employee_id` | UUID     | FK → employees.id, UNIQUE | 员工 ID        |
| `created_at`  | DATETIME | NOT NULL                  | 创建时间       |

---

## 🔗 相关文档

- [ 组织管理设计 ](../product/org-management)
- [ 用户管理技术设计 ](../technical/user-management)
