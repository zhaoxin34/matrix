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
│       ├── config.py      # 配置中心
│       ├── user.py         # 用户模型
│       ├── state.py        # 状态机
│       ├── engine.py       # 活跃引擎
│       ├── calculator.py   # 权重计算器
│       └── simulator.py    # 时间模拟器
├── tests/
│   └── test_*.py           # 单元测试
└── data/                   # 数据目录
    └── users.json          # 用户数据
```

## 任务清单

### Phase 1: 核心引擎（MVP）

- [x] **T1.1** 创建项目结构，初始化 Python 包
- [x] **T1.2** 实现配置中心（config.py）：管理所有可配置参数
- [ ] **T1.3** 实现用户模型（user.py）：
  - 用户特征表（17个字段）
  - 用户状态表（3个字段）
  - 用户生成器（基于统计分布）
- [ ] **T1.4** 实现状态机（state.py）：
  - 转化矩阵定义
  - 状态转移逻辑
- [ ] **T1.5** 实现权重计算器（calculator.py）：
  - w_login, w_browse, w_cart, w_pay, w_return
  - 基于用户客观特征计算
- [ ] **T1.6** 实现活跃引擎（engine.py）：
  - 热衰减模型
  - 职业基础概率
  - 时段系数
- [ ] **T1.7** 实现时间模拟器（simulator.py）：
  - 批量生成用户行为轨迹
  - 支持时间加速/减速

### Phase 2: 数据与事件

- [ ] **T2.1** 实现事件总线：用户活跃、退出、支付等事件
- [ ] **T2.2** 实现数据存储：用户特征、状态、轨迹持久化
- [ ] **T2.3** 数据导出：JSON/CSV 格式

### Phase 3: 工具与优化

- [ ] **T3.1** 行为轨迹可视化
- [ ] **T3.2** 参数调优工具
- [ ] **T3.3** 性能优化：支持大规模用户模拟

## 核心参数配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| decay_lambda | 0.01 | 热衰减系数 |
| base_prob | 见用户特征表 | 各职业基础活跃概率 |
| time_multiplier | 1.2/1.0/0.3 | 高峰/正常/低峰时段系数 |

## 关键数据结构

### 用户特征（17字段）

```python
UserProfile = {
    "user_id": str,
    "age": int,
    "gender": int,  # 0女/1男
    "marital_status": int,
    "child_count": int,
    "child_age_group": int,
    "has_house": int,
    "has_car": int,
    "has_mortgage": int,
    "has_car_loan": int,
    "has_other_loan": int,
    "dependent_parents": int,
    "occupation_type": int,
    "employment_status": int,
    "industry": int,
    "work_experience": int,
    "education_level": int,
    "income_monthly": int,
    "income_stable": int,
    "savings_level": int,
    "has_investment": int,
    "spending_style": int,
    "payment_preference": int,
}
```

### 用户状态（3字段）

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

## 下一步行动

1. 创建项目基础结构
2. 实现配置中心
3. 实现用户模型和生成器

---

*最后更新: 2026-04-29*
