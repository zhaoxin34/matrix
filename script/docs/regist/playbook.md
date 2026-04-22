# 电商网站操作手册

## 用户创建方法

### 方法一：SQL 直接插入（需要生成 bcrypt hash）

#### 步骤 1：生成 bcrypt hash
```python
python3 -c "
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
hashed = pwd_context.hash('YourPassword123')
print(hashed)
"
```
输出示例：`$2b$12$foqV9YaZ8ZhKPPyvpL03aOy.XBG/NehLTBadHOQK0YNKYPwREXx5y`

#### 步骤 2：连接数据库
```bash
mysql -h127.0.0.1 -uroot -proot ecommerce
```

#### 步骤 3：插入用户
```sql
INSERT INTO users (username, email, phone, hashed_password, created_at, updated_at)
VALUES ('sqltest', 'sqltest@example.com', '13890138003', '$2b$12$YOUR_HASH_HERE', NOW(), NOW());
```

#### 步骤 4：验证用户
```bash
# 通过 API 登录验证
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13890138003","password":"YourPassword123"}'
```

**验证结果**：返回 access_token 和 refresh_token 表示成功。

---

### 方法二：通过 API 注册

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"apitest","phone":"13800138002","email":"apitest@example.com","password":"Test1234"}'
```

**必填参数：**
- `username`: 2-50字符，用户名唯一
- `phone`: 手机号（格式：1[3-9]xxxxxxxx），唯一
- `email`: 邮箱（5-100字符），唯一
- `password`: 至少8位，必须包含字母和数字

**注意**：
- 注册接口有频率限制：3次/小时
- 密码要求：至少8位，需包含字母和数字
- 手机号和邮箱必须唯一

---

## 数据库信息

- 数据库类型：MySQL
- 连接命令：`mysql -h127.0.0.1 -uroot -proot ecommerce`
- 用户表：`users`

### users 表关键字段
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| email | VARCHAR(100) | 邮箱，唯一 |
| phone | VARCHAR(20) | 手机号，唯一 |
| hashed_password | VARCHAR(255) | bcrypt 哈希密码 |
| is_admin | BOOLEAN | 是否管理员 |
| created_at | DATETIME | 创建时间 |
