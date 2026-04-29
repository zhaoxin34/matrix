# 2026-4-27

场景, 实现自学习、自组织

```
数据分析师：
发现“首单后7天复购率低”

↓

用户运营：
设计策略：
→ 第3天发券 + 推荐商品

↓

算法工程师：
优化：
→ 哪些人值得发券？

↓

前后端工程师：
实现：
→ 规则引擎 + 定时触达

↓

活动运营：
配置并上线

↓

数据分析师：
评估效果（是否提升复购）
```

workspace:

- 角色
  - 用户运营
  - 数据分析师
  - 数据/算法工程师
- 数据源
- 沙箱

- cdp 产品
  - [ ] skill
    - [x] markdown editor
    - [x] 版本
    - [ ] 去掉作者，使用user_id
    - [ ] 添加agent-prototype-id
  - [ ] 去掉项目概念，改用工作空间概念
  - [ ] Agent Prototype
    - [ ] Agent员工是多对一
    - [ ] agent 和技能是一对多, 注意skill的版本问题
  - [ ] 沙箱系统
    - [ ] 触达程序
    - [ ] 规则引擎
- [ ] install and setup lightrag
- [ ] anylyst 分析系统
  - [ ] create data collector api
  - [ ] design and create event table
- [ ] oracle 先知 - 模拟数据生成系统 - 引导作用

❯ /opsx:explore 对skill libraray这个功能进行一次大改动

1. 去掉author这个树形，改用user_id，也就是user表的id
2. 增加一个版本的概念，每次content新建或更新，都是更新成草稿，只有通过发布，才能变成正式的content，并且把版本号+1, 记录版本创建的时间，版本号是1，23这样的数字，保留版本历史信息，可以回滚，回滚操作只是把被回滚的版本号
3. 前端content使用markdown编辑器，而不是一个文本框
