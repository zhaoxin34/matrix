# Sati 用户行为模拟系统 - 实施计划

## 项目概述

Sati 是一个用于模拟电商用户行为的系统，通过用户特征、状态机、热衰减模型计算用户下一步动作，为 AI 自主决策研究提供真实的行为模拟数据。

## 核心公式

```
next_action = argmax_{action ∈ Allowed(current_state)} [ Active(time, user) × W(current_state, action) ]
```

## 目录结构

```
sati/
├── docs/
│   └── roadmap.md          # 本文档
├── src/
│   └── sati/              # Python 包
│       ├── __init__.py
│       ├── config.py      # 配置中心（含 MySQL 配置）
│       ├── user.py         # 用户模型
│       ├── generator.py   # 用户生成器
│       ├── state.py        # 状态机
│       ├── engine.py       # 活跃引擎
│       ├── calculator.py   # 权重计算器
│       ├── simulator.py    # 时间模拟器
│       ├── database.py     # MySQL 数据库连接层
│       └── cli.py          # CLI 命令行工具
├── tests/
│   └── test_*.py           # 单元测试
└── logs/                   # 日志目录
```

## 任务清单

### Phase 1: 核心引擎（MVP）

- [x] **T1.1** 创建项目结构，初始化 Python 包
- [x] **T1.2** 实现配置中心（config.py）：管理所有可配置参数
- [x] **T1.3** 实现用户模型（user.py）：
  - 用户特征表（23个字段）
  - 用户状态表（4个字段）
  - 用户生成器（基于统计分布）
- [x] **T1.4** 实现状态机（state.py）：
  - 转化矩阵定义
  - 状态转移逻辑
- [x] **T1.5** 实现权重计算器（calculator.py）：
  - w_login, w_browse, w_cart, w_pay, w_return
  - 基于用户客观特征计算
- [x] **T1.6** 实现活跃引擎（engine.py）：
  - 热衰减模型
  - 职业基础概率
  - 时段系数
- [x] **T1.7** 实现时间模拟器（simulator.py）：
  - 批量生成用户行为轨迹
  - 支持时间加速/减速

### Phase 2: 数据持久化

- [x] **T2.1** 实现 MySQL 数据库连接层（database.py）
  - SQLAlchemy ORM 模型
  - 用户数据 CRUD 操作
- [x] **T2.2** 实现 CLI 命令行工具（cli.py）
  - `sati init-db` - 初始化数据库和表
  - `sati create-user -n <count>` - 创建指定数量用户并持久化
- [ ] **T2.3** 数据导出：JSON/CSV 格式

## 核心参数配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| decay_lambda | 0.01 | 热衰减系数 |
| base_prob | 见用户特征表 | 各职业基础活跃概率 |
| time_multiplier | 1.2/1.0/0.3 | 高峰/正常/低峰时段系数 |
| DB_HOST | 127.0.0.1 | MySQL 主机地址 |
| DB_PORT | 3306 | MySQL 端口 |
| DB_NAME | sati | 数据库名称 |

## 数据库配置

**MySQL 连接：**
```bash
mysql -uroot -proot -h 127.0.0.1
```

**users 表结构：**
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | VARCHAR(36) | UUID，主键 |
| age | INT | 年龄 |
| gender | TINYINT | 0=女 1=男 |
| ... | ... | 其他23个字段 |

## CLI 使用方法

```bash
# 初始化数据库（创建 sati 数据库和 users 表）
make cli ARGS="init-db"

# 创建100个用户并存储到 MySQL
make cli ARGS="create-user -n 100"

# 使用固定种子创建50个用户（可复现）
make cli ARGS="create-user -n 50 --seed 42"
```

## 关键数据结构

### 用户特征（23字段）

```python
UserProfile = {
    "user_id": str,              # UUID
    "age": int,                   # 18-65
    "gender": int,                # 0女/1男
    "marital_status": int,        # 0未婚 1已婚 2离异 3丧偶
    "child_count": int,
    "child_age_group": int,       # 0无 1婴幼儿 2小学 3中学 4大学+
    "has_house": int,             # 0无 1有房贷 2全款
    "has_car": int,               # 0无 1有车贷 2全款
    "has_mortgage": int,          # 0无 1有
    "has_car_loan": int,           # 0无 1有
    "has_other_loan": int,         # 0无 1有
    "dependent_parents": int,
    "occupation_type": int,        # 1学生 2公务员 3企业职工 4自由职业 5个体户 6退休
    "employment_status": int,     # 1全职 2兼职 3自由 4失业
    "industry": int,              # 1互联网 2金融 3制造 4零售 5医疗 6教育 7其他
    "work_experience": int,
    "education_level": int,       # 1初中 2高中 3大专 4本科 5硕士 6博士
    "income_monthly": int,        # 元
    "income_stable": int,         # 1不稳定 2基本稳定 3非常稳定
    "savings_level": int,          # 1<5万 2=5-20万 3=20-50万 4=50-100万 5>100万
    "has_investment": int,         # 0无 1有
    "spending_style": int,         # 1节俭 2稳健 3冲动 4享乐
    "payment_preference": int,     # 1信用卡 2花呗 3借呗 4全额
}
```

### 用户状态（4字段）

```python
UserState = {
    "last_active_time": int,  # Unix 时间戳
    "last_exit_time": int,
    "session_count": int,
    "current_state": str,     # 落地页/登录/浏览/加购/支付/退出
}
```

### 转化矩阵

| 当前状态 ↓ / 下一状态 → | 落地页 | 登录 | 浏览 | 加购 | 支付 | 退出 |
|------------------------|--------|------|------|------|------|------|
| 落地页 | 0 | 1 | 1 | 0 | 0 | 1 |
| 登录 | 0 | 0 | 1 | 0 | 0 | 1 |
| 浏览 | 1 | 0 | 1 | 1 | 0 | 1 |
| 加购 | 1 | 0 | 1 | 1 | 1 | 1 |
| 支付 | 1 | 0 | 0 | 0 | 0 | 1 |
| 退出 | 0 | 0 | 0 | 0 | 0 | 0 |

## 开发规范

1. 源代码放 `src/sati/`，测试放 `tests/`
2. 所有参数可配置，不硬编码
3. 每次完成后运行 `/simplify` 简化代码
4. 编写单元测试覆盖核心逻辑
5. 使用 SQLAlchemy ORM 进行数据库操作

## 下一步行动

1. ~~创建项目基础结构~~
2. ~~实现配置中心~~
3. ~~实现用户模型和生成器~~
4. ~~实现 MySQL 数据存储（Phase 2）~~
5. ~~实现 CLI 命令行工具~~
6. 实现数据导出 JSON/CSV（Phase 2 T2.3）

---

*最后更新: 2026-04-30*
