---
id: user-management
title: 用户管理技术设计
author: Joky.Zhao
created: 2026-05-13
updated: 2026-05-13
version: 1.0.0
tags: [技术设计, 用户管理]
---

> 📄 本文档为用户管理技术设计文档，完整的产品设计请参见 [用户管理设计](../product/user-management)

---

## 🎨 API 设计

### 1.1 用户注册

**端点**：`POST /api/v1/auth/register`

**请求体**：

```json
{
  "phone": "13800138001",
  "code": "123456",
  "password": "Abcd1234"
}
```

**响应**：

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "user_id": "usr_abc123",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

**错误场景**：
| 错误码 | 说明 | 处理方式 |
| ------ | ---- | -------- |
| `1001` | Invalid Parameter（字段校验失败） | 返回 400，提示具体字段 |
| `2002` | User Already Exists（手机号已注册） | 返回 409，提示手机号已存在 |
| `1003` | Invalid Code（验证码错误） | 返回 400，提示验证码错误 |
| `1004` | Code Expired（验证码过期） | 返回 400，提示重新获取 |

### 1.2 用户登录

**端点**：`POST /api/v1/auth/login`

**请求体**：

```json
{
  "phone": "13800138001",
  "password": "Abcd1234"
}
```

**响应**：

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "user_id": "usr_abc123",
    "token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

**错误场景**：
| 错误码 | 说明 | 处理方式 |
| ------ | ---- | -------- |
| `2001` | User Not Found（用户不存在） | 返回 404 |
| `1002` | Invalid Password（密码错误） | 返回 401，提示密码错误 |
| `2003` | User Disabled（用户已被禁用） | 返回 403，提示账户已被禁用 |

### 1.3 发送验证码

**端点**：`POST /api/v1/auth/send-code`

**请求体**：

```json
{
  "phone": "13800138001",
  "type": "register" // register | login | reset_password
}
```

**响应**：

```json
{
  "code": 0,
  "message": "验证码已发送",
  "data": {
    "expires_in": 300
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

### 1.4 用户列表（超级管理员）

**端点**：`GET /api/v1/admin/users`

**查询参数**：
| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| `page` | int | 页码，默认 1 |
| `page_size` | int | 每页数量，默认 20 |
| `search` | string | 搜索用户名/手机号 |

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
        "id": 123,
        "phone": "13800138001",
        "username": "张三",
        "email": "zhang@qq.com",
        "is_admin": false,
        "is_active": true,
        "created_at": "2026-05-13T10:00:00Z"
      }
    ]
  },
  "traceId": "abc-123",
  "timestamp": 1713700000000
}
```

### 1.5 创建用户（超级管理员）

**端点**：`POST /api/v1/admin/users`

**请求体**：

```json
{
  "phone": "13800138001",
  "username": "张三",
  "email": "zhang@qq.com"
}
```

### 1.6 编辑用户（超级管理员）

**端点**：`PUT /api/v1/admin/users/{id}`

**请求体**：

```json
{
  "username": "张三更新",
  "email": "zhang_new@qq.com"
}
```

### 1.7 启用/禁用用户（超级管理员）

**端点**：`PATCH /api/v1/admin/users/{id}/status`

**请求体**：

```json
{
  "is_active": false
}
```

**说明**：启用/禁用用户后，用户将无法/恢复登录。

> ⚠️ **暂不支持删除用户**，如需停用用户，请使用禁用功能。

---

## 🗄️ 数据库设计

### 2.1 用户表 (users)

| 字段              | 类型         | 约束               | 说明               |
| ----------------- | ------------ | ------------------ | ------------------ |
| `id`              | INT          | PK, AUTO_INCREMENT | 自增主键           |
| `username`        | VARCHAR(50)  | UNIQUE, NOT NULL   | 用户名             |
| `phone`           | VARCHAR(20)  | UNIQUE, NOT NULL   | 手机号             |
| `email`           | VARCHAR(100) | UNIQUE             | 邮箱               |
| `hashed_password` | VARCHAR(255) | NOT NULL           | 密码哈希（bcrypt） |
| `is_admin`        | BOOLEAN      | DEFAULT false      | 是否管理员         |
| `is_active`       | BOOLEAN      | DEFAULT true       | 是否激活           |
| `created_at`      | DATETIME     | NOT NULL           | 创建时间           |
| `updated_at`      | DATETIME     | NOT NULL           | 更新时间           |

### 2.2 用户与员工关联表 (user_employee_mapping)

| 字段          | 类型     | 约束                      | 说明     |
| ------------- | -------- | ------------------------- | -------- |
| `id`          | INT      | PK, AUTO_INCREMENT        | 自增主键 |
| `user_id`     | INT      | FK → users.id, UNIQUE     | 用户 ID  |
| `employee_id` | INT      | FK → employees.id, UNIQUE | 员工 ID  |
| `created_at`  | DATETIME | NOT NULL                  | 创建时间 |

---

## 🔐 安全设计

### 3.1 密码存储

- 使用 bcrypt 算法进行密码哈希
- 盐值自动生成，每用户独立
- 不得明文存储密码

### 3.2 Token 设计

- **访问令牌**（Access Token）：有效期 24 小时
- **刷新令牌**（Refresh Token）：有效期 7 天
- 存储在 httpOnly Cookie 中，防止 XSS 攻击

### 3.3 验证码策略

- 验证码有效期 5 分钟
- 验证码输入错误 3 次后需重新获取
- 验证码仅可使用一次

---

## 🔗 相关文档

- [ 用户管理设计 ](../product/user-management)
- [ 组织管理技术设计 ](../technical/org-management) (TODO)
