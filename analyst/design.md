# 背景

电商网站ecommerce 自身的功能无法了解网站的运营状态，所以也就无法实现运营方案

# 目标

建立一个数据仓库，用于采集和分析数据

# 技术方案

## 数据仓库分层设计

```
┌─────────────────────────────────────────────────────────┐
│                    数据分层架构                          │
├─────────────────────────────────────────────────────────┤
│  DIM (Dimension) - 维度层                                 │
│  缓慢变化维度，低基数（用户、商品、分类、时间）            │
├─────────────────────────────────────────────────────────┤
│  DWD (Data Warehouse Detail) - 明细数据层                 │
│  事实表，存储业务过程数据                                  │
└─────────────────────────────────────────────────────────┘
```

---

## DIM层 - 维度层

存储低基数、相对稳定的维度数据。

### dim_products 商品维度表

| 字段名         | 类型          | 说明             |
| -------------- | ------------- | ---------------- |
| product_id     | INT           | 代理键，主键     |
| original_id    | INT           | 原始业务ID，唯一 |
| name           | VARCHAR(200)  | 商品名称         |
| description    | TEXT          | 商品描述         |
| price          | DECIMAL(10,2) | 售价             |
| original_price | DECIMAL(10,2) | 原价             |
| brand          | VARCHAR(100)  | 品牌             |
| category_id    | INT           | 分类ID           |
| is_active      | TINYINT       | 是否上架         |
| created_at     | DATETIME      | 创建时间         |
| etl_time       | DATETIME      | ETL时间          |

### dim_categories 分类维度表

| 字段名      | 类型         | 说明             |
| ----------- | ------------ | ---------------- |
| category_id | INT          | 代理键，主键     |
| original_id | INT          | 原始业务ID，唯一 |
| name        | VARCHAR(100) | 分类名称         |
| parent_id   | INT          | 父分类ID         |
| etl_time    | DATETIME     | ETL时间          |

### dim_date 时间维度表

| 字段名       | 类型         | 说明       |
| ------------ | ------------ | ---------- |
| date_key     | DATE         | 日期，主键 |
| year         | INT          | 年份       |
| quarter      | INT          | 季度       |
| month        | INT          | 月份       |
| month_name   | VARCHAR(20)  | 月份名称   |
| week_of_year | INT          | 年中第几周 |
| day_of_week  | INT          | 周几       |
| day_name     | VARCHAR(20)  | 周几名称   |
| is_weekend   | TINYINT      | 是否周末   |
| is_holiday   | TINYINT      | 是否节假日 |
| holiday_name | VARCHAR(100) | 节假日名称 |

### dim_order_status 订单状态维度表

| 字段名      | 类型         | 说明         |
| ----------- | ------------ | ------------ |
| status_code | VARCHAR(50)  | 状态码，主键 |
| status_name | VARCHAR(100) | 状态名称     |
| is_paid     | TINYINT      | 是否已支付   |
| is_complete | TINYINT      | 是否已完成   |

---

## DWD层 - 事实数据层

存储业务过程数据，支持多维度分析。

### dwd_fact_orders 订单事实表

每笔订单的每个商品明细作为一行，支持商品维度的销售分析。

| 字段名                 | 类型          | 说明                           |
| ---------------------- | ------------- | ------------------------------ |
| order_detail_id        | INT           | 主键，自增                     |
| original_order_id      | INT           | 原始订单ID                     |
| original_order_item_id | INT           | 原始订单明细ID                 |
| user_id                | INT           | 用户维度（引用dim_users）      |
| product_id             | INT           | 商品维度（引用dim_products）   |
| category_id            | INT           | 分类维度（引用dim_categories） |
| date_key               | DATE          | 下单日期（引用dim_date）       |
| order_status           | VARCHAR(50)   | 订单状态                       |
| is_paid                | TINYINT       | 是否已支付                     |
| is_completed           | TINYINT       | 是否已完成                     |
| unit_price             | DECIMAL(10,2) | 单价                           |
| quantity               | INT           | 数量                           |
| item_amount            | DECIMAL(10,2) | 明细金额                       |
| order_total_amount     | DECIMAL(10,2) | 订单总金额                     |
| created_at             | DATETIME      | 下单时间                       |
| paid_at                | DATETIME      | 支付时间                       |
| completed_at           | DATETIME      | 完成时间                       |
| etl_time               | DATETIME      | ETL时间                        |

### dwd_fact_events 用户事件事实表

采集用户在网站上的行为事件，支持用户行为分析。

| 字段名      | 类型         | 说明                 |
| ----------- | ------------ | -------------------- |
| session_id  | VARCHAR(64)  | 会话ID               |
| user_id     | INT          | 用户维度（可为空）   |
| event_name  | VARCHAR(100) | 事件名称             |
| event_time  | DATETIME     | 事件发生时间         |
| event_value | VARCHAR(500) | 事件附加数据（JSON） |
| ip_address  | VARCHAR(45)  | IP地址               |
| user_agent  | VARCHAR(500) | 浏览器UA             |
| create_time | DATETIME     | 数据的创建时间       |

---

## 数据同步策略

采用最简单的SQL批量同步方案：

1. **维度表同步**：一次性全量同步
2. **事实表同步**：定期全量同步

后续可根据需求升级为CDC实时同步。

