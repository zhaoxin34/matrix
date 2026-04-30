# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

Sati 是一个用于模拟电商用户行为的系统，通过用户特征、状态机、热衰减模型计算用户下一步动作，为 AI 自主决策研究提供真实的行为模拟数据。

## 目录结构

```
sati/
├── src/sati/           # Python 包
│   ├── __init__.py
│   ├── config.py       # 配置中心
│   ├── user.py         # 用户模型（特征 + 状态）
│   ├── generator.py    # 用户生成器（基于统计分布）
│   ├── state.py        # 状态机
│   ├── engine.py       # 活跃引擎（热衰减模型）
│   ├── calculator.py   # 权重计算器
│   └── simulator.py    # CLI 模拟器
├── tests/              # 单元测试
├── logs/               # 日志目录
│   └── sati.log        # 日志文件
└── docs/               # 文档
```

## 常用命令

```bash
# 安装依赖
make install

# 运行模拟器
make dev

# 运行测试
make test

# 代码检查和格式化
make lint
make format

# 类型检查
make type-check
```

## 核心公式

```
next_action = argmax_{action ∈ Allowed(current_state)} [ Active(time, user) × W(current_state, action) ]
```

## 用户特征（17字段）

| 字段 | 说明 |
|------|------|
| user_id | 唯一标识 |
| age | 年龄 |
| gender | 性别(0女/1男) |
| marital_status | 婚姻状态(0未婚/1已婚/2离异/3丧偶) |
| child_count | 子女数量 |
| child_age_group | 子女年龄段 |
| has_house | 房产状况(0无/1有房贷/2全款) |
| has_car | 车辆状况(0无/1有车贷/2全款) |
| has_mortgage | 是否有房贷 |
| has_car_loan | 是否有车贷 |
| has_other_loan | 是否有其他贷款 |
| dependent_parents | 需赡养父母人数 |
| occupation_type | 职业类型(1-6) |
| employment_status | 就业状态(1-4) |
| industry | 行业(1-7) |
| work_experience | 工作年限 |
| education_level | 学历(1-6) |
| income_monthly | 月收入 |
| income_stable | 收入稳定性(1-3) |
| savings_level | 存款级别(1-5) |
| has_investment | 是否有投资 |
| spending_style | 消费风格(1-4) |
| payment_preference | 支付偏好(1-4) |

## 配置

- 日志文件: `logs/sati.log`
- 热衰减系数: `DECAY_LAMBDA = 0.01`
