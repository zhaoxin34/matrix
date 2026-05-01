# 背景

为了打造一个逼真的matrix世界，需要创造一个模拟用户行为的系统，项目代号取作Sati，Sati是骇客帝国中的印度小女孩,有自我意识的程序，代表程序的希望与进化。

# 目标

设计虚拟用户的特征，系统根据用户虚拟特征做出下一步动作。

## 计算用户下一个动作的概括性公式

```
next_action = argmax_{action ∈ Allowed(current_state)} [ Active(time, user) × W(current_state, action) × W_page(page_state, action) ]
```

其中：
- `Active(time, user)`：用户在当前时刻的活跃概率（热衰减模型）
- `W(current_state, action)`：从当前状态转移到目标状态的权重（由用户特征计算）
- `W_page(page_state, action)`：当前页面状态对动作的权重影响
- `Allowed(current_state)`：根据转化矩阵，当前状态允许转移的目标状态集合

**计算步骤**：
1. 根据 `current_state` 和转化矩阵，获取所有允许的 `next_state`
2. 计算每个允许动作的权重 `W = f(用户特征)`
3. 获取用户在当前时刻的活跃概率 `Active(time, user)`
4. 获取当前页面状态的权重因子 `W_page = f(page_state, action)`
5. 计算综合得分 `Score = Active × W × W_page`
6. 选取得分最高的动作作为下一个动作

**说明**：`page_state` 是上一次动作执行后返回的页面状态，`W_page` 用于衡量页面内容对用户下一步行为的影响（如详情页比列表页更容易触发加购）。

# 方案

## 用户特征表

| 特征类别 | 字段名 | 说明 | 示例值 |
|---------|--------|------|--------|
| **基础属性** | user_id | 唯一标识 | UUID |
| | age | 年龄 | 28 |
| | gender | 性别(0女/1男) | 0 |
| **家庭状况** | marital_status | 婚姻状态(0未婚/1已婚/2离异/3丧偶) | 1 |
| | child_count | 子女数量 | 1 |
| | child_age_group | 子女年龄段(0无/1婴幼儿/2小学/3中学/4大学+) | 2 |
| **住房状况** | has_house | 是否有房(0无/1有房贷/2全款) | 1 |
| | has_car | 是否有车(0无/1有车贷/2全款) | 2 |
| **财务负担** | has_mortgage | 是否有房贷(0否/1是) | 1 |
| | has_car_loan | 是否有车贷(0否/1是) | 0 |
| | has_other_loan | 是否有其他贷款(0否/1是) | 0 |
| | dependent_parents | 需赡养父母人数(0-4) | 2 |
| **职业状况** | occupation_type | 职业类型(1学生/2公务员/3企业职工/4自由职业/5个体户/6退休) | 3 |
| | employment_status | 就业状态(1全职/2兼职/3自由/4失业) | 1 |
| | industry | 行业(1互联网/2金融/3制造/4零售/5医疗/6教育/7其他) | 1 |
| | work_experience | 工作年限 | 6 |
| **教育背景** | education_level | 学历(1初中/2高中/3大专/4本科/5硕士/6博士) | 4 |
| **经济状况** | income_monthly | 月收入(元) | 15000 |
| | income_stable | 收入稳定性(1不稳定/2基本稳定/3非常稳定) | 2 |
| | savings_level | 存款级别(1<5万/2 5-20万/3 20-50万/4 50-100万/5 >100万) | 2 |
| | has_investment | 是否有投资理财(0否/1是) | 1 |
| **消费倾向** | spending_style | 消费风格(1节俭/2稳健/3冲动/4享乐) | 2 |
| | payment_preference | 支付偏好(1信用卡/2花呗/3借呗/4全额) | 4 |

## 用户状态表

| 字段 | 说明 | 示例值 |
|------|------|--------|
| last_active_time | 最后活跃时间(Unix时间戳) | 1743283200 |
| last_exit_time | 最后退出时间(Unix时间戳) | 1743286800 |
| session_count | 累计会话数 | 15 |
| current_page_state | 当前页面状态 | 见 PageState 表 |

## PageState（页面状态）

用户动作执行后，返回的页面状态信息。

### 数据结构

```
PageState = {
    page_type: str,           # 页面类型：landing, browse, login, add_cart, payment, exit
    page_subtype: str,         # 页面子类型：homepage, red_packet, coupon, product_list, product_detail, cart, payment_page
    page_attributes: {         # 页面属性（dict）
        category?: str,       # 商品分类（如 "数码"）
        brand?: str,          # 品牌（如 "Apple"）
        price_range?: str,    # 价格区间（如 "5000-8000"）
        discount?: float,     # 折扣率（如 0.85）
        product_id?: str,     # 商品ID
        ...
    }
}
```

### page_subtype 定义

| page_type | page_subtype | page_attributes 示例 |
|-----------|--------------|---------------------|
| landing | homepage | {banner: [...]} |
| landing | red_packet | {amount: 10, expire_hours: 24} |
| landing | coupon | {discount: 50, min_amount: 200} |
| browse | product_list | {category: "数码", count: 20} |
| browse | product_detail | {product_id, category, brand, price, discount?, ...} |
| add_cart | cart_page | {items_count: 3, total_amount: 5999} |
| payment | payment_page | {order_id, amount, payment_methods: [...]} |
| login | login_page | {} |
| exit | - | {} |

### PageFeedback 接口

页面反馈器，根据用户动作返回对应的页面状态。

```python
class PageFeedback(Protocol):
    def get_page_state(self, user_id: str, action: str, current_state: str) -> PageState:
        """根据用户动作返回页面状态"""
        ...
```

**实现要求**：
- 现阶段提供 FakePageFeedback 作为模拟实现
- 未来可替换为调用真实接口的实现

## 用户行动转化矩阵

横轴表示**下一状态**，纵轴表示**当前状态**。1=允许，0=不允许。

| 当前状态 ↓ / 下一状态 → | 落地页 | 登录 | 浏览 | 加购 | 支付 | 退出 |
|------------------------|--------|------|------|------|------|------|
| **落地页** | 0 | 1 | 1 | 0 | 0 | 1 |
| **登录** | 0 | 0 | 1 | 0 | 0 | 1 |
| **浏览** | 1 | 0 | 1 | 1 | 0 | 1 |
| **加购** | 1 | 0 | 1 | 1 | 1 | 1 |
| **支付** | 1 | 0 | 0 | 0 | 0 | 1 |
| **退出** | 0 | 0 | 0 | 0 | 0 | 0 |


### 业务逻辑说明

- **落地页 → 登录**: 用户点击登录入口
- **落地页 → 浏览**: 用户直接开始浏览商品
- **浏览 → 加购**: 用户选择商品加入购物车
- **加购 → 支付**: 用户结算购物车
- **支付 → 落地页**: 支付完成后返回首页
- **退出**: 任何状态都可以退出（会话结束）

## 用户行动计算公式

### 公式定义

```
P(下一状态) = W(当前状态, 下一状态) / ΣW(当前状态, 所有允许状态)
```

其中：
- `W(当前状态, 下一状态) = w_特征 × M(当前状态, 下一状态)`
- `M` 为转化矩阵值（0或1）
- `w_特征` 为根据用户特征计算的权重

### 权重计算（基于客观特征）

| 特征 | 权重因子 | 计算方式 |
|------|---------|----------|
| 登录意愿 | w_login | 0.3 + 0.2 × income_stable - 0.1 × has_other_loan |
| 浏览深度 | w_browse | 0.5 + 0.1 × (work_experience / 10) + 0.1 × education_level |
| 加购倾向 | w_cart | 0.4 × (income_monthly / 10000) × (1 + 0.2 × child_count) |
| 支付转化 | w_pay | 0.6 × (savings_level / 5) × (1 / spending_style) |
| 复访频率 | w_return | 0.3 + 0.1 × (income_stable - 1) + 0.05 × (education_level - 1) |

### 页面状态权重（W_page）

| 当前页面 | action | W_page 因子 | 说明 |
|---------|--------|-------------|------|
| homepage | browse | 1.0 | 默认 |
| red_packet | browse | 1.2 | 红包吸引更容易浏览 |
| coupon | browse | 1.1 | 优惠券吸引浏览 |
| product_list | browse | 1.0 | 默认 |
| product_detail | add_cart | 1.5 | 详情页更容易加购 |
| product_detail | browse | 0.8 | 详情页深度浏览后可能返回 |
| cart_page | payment | 1.3 | 购物车结算意愿更强 |
| payment_page | exit | 1.2 | 支付页更可能直接退出 |
| login_page | browse | 0.5 | 登录页可能放弃 |

**计算公式**：
```
W_page = base_factor × (1 + influence_factor)
```
其中 `influence_factor` 由页面属性决定（如详情页商品价格越高，`add_cart` 的 W_page 越低）。

### 状态转移权重映射

| 当前状态 | 可转移状态 | 权重计算 | W_page 影响 |
|----------|-----------|----------|-------------|
| 落地页 | 登录 | w_login | - |
| 落地页 | 浏览 | w_browse | homepage/red_packet/coupon |
| 落地页 | 退出 | 1.0 | - |
| 登录 | 浏览 | w_browse | - |
| 登录 | 退出 | 1.0 | - |
| 浏览 | 落地页 | 0.5 | - |
| 浏览 | 加购 | w_cart | product_detail 时 ×1.5 |
| 浏览 | 退出 | 1.0 | - |
| 加购 | 落地页 | 0.5 | - |
| 加购 | 浏览 | w_browse | - |
| 加购 | 支付 | w_pay | cart_page 时 ×1.3 |
| 加购 | 退出 | 1.0 | - |
| 支付 | 落地页 | w_return | - |
| 支付 | 退出 | 1.0 | payment_page 时 ×1.2 |
| 退出 | - | 0（终止状态） | - |

### 示例计算

假设用户特征：
- income_stable=2, has_other_loan=0, work_experience=6, education_level=4
- income_monthly=15000, child_count=1, savings_level=2, spending_style=2

计算：
- w_login = 0.3 + 0.2 × 2 - 0.1 × 0 = 0.7
- w_browse = 0.5 + 0.1 × 0.6 + 0.1 × 4 = 0.96
- w_cart = 0.4 × 1.5 × 1.2 = 0.72
- w_pay = 0.6 × 0.4 × 0.5 = 0.12

**场景：用户在「浏览」状态，当前页面为 product_detail（商品详情页）**

| 下一状态 | W = w × M | W_page | Score = W × W_page | P = Score / ΣScore |
|----------|-----------|--------|---------------------|-------------------|
| 落地页 | 0.5 | 1.0 | 0.5 | 0.5 / 2.68 = 0.19 |
| 加购 | 0.72 | 1.5 | 1.08 | 1.08 / 2.68 = 0.40 |
| 退出 | 1.0 | 1.0 | 1.0 | 1.0 / 2.68 = 0.37 |
| 浏览(自身) | 0.5 | 0.8 | 0.4 | 0.4 / 2.68 = 0.15 |
| 登录 | 0（不允许） | - | 0 | 0 |
| 支付 | 0（不允许） | - | 0 | 0 |
| **Σ** | 2.3 | - | 2.98 | 1.00 |

**场景对比：若当前页面为 product_list（列表页）**

| 下一状态 | W_page | Score = W × W_page | P |
|----------|--------|---------------------|---|
| 加购 | 1.0 | 0.72 | 0.72 / 2.5 = 0.29 |
| （其他不变） | - | 略 | 略 |

**结论**：详情页（product_detail）的加购概率（40%）明显高于列表页（29%），符合实际业务逻辑。

## 活跃判断公式（热衰减模型）

### 核心公式

```
Active(time, user) = P_base(occupation, hour, weekday) × decay(Δt)
```

其中：
- `Δt = time - last_exit_time`（距上次退出时间，分钟）
- `decay(Δt) = e^(-λ × Δt)`（热衰减系数）
- `λ = 0.01`（衰减率，可调）

### 职业基础活跃概率

| 职业 | base_prob | 高活跃时段 |
|------|-----------|------------|
| 学生 | 0.8 | 14-18, 19-23 |
| 公务员 | 0.7 | 9-11, 14-17 |
| 企业职工 | 0.75 | 12-13, 20-23 |
| 自由职业 | 0.5 | 分散全天 |
| 个体户 | 0.6 | 9-18 |
| 退休 | 0.4 | 8-11, 14-16 |

### 时段系数

| 时段 | time_multiplier |
|------|----------------|
| 高峰时段 | 1.2 |
| 正常时段 | 1.0 |
| 低峰时段 | 0.3 |

### 热衰减效果

| 距上次退出时间 | decay 系数 |
|---------------|------------|
| 0-5分钟 | 0.95-0.97（冷却期） |
| 5-30分钟 | 0.74-0.95 |
| 30-60分钟 | 0.52-0.74 |
| 1-3小时 | 0.19-0.52 |
| 3小时+ | <0.19（基本恢复） |

### 判断流程

```
if random() < Active(time, user):
    return 1  # 活跃
else:
    return 0  # 不活跃
```

### 更新状态

每次判断活跃后，更新用户状态：
- 若活跃：last_active_time = time
- 若退出：last_exit_time = time, session_count += 1

