背景：之前完成了一次技术改进，改变了frontend的技术架构，但是由于担心改动太大，所以frontend保留了，新建了frontend2，来复刻frontend的全部功能
font2-error.md 列举了一些问题，每个问题都有一个状态，状态的值可以是复中，修复失败，修复成功
工作步骤

1. 使用playwright-cli，访问页面分析问题
2. 如果不能修复，比如你无法确认问题，或者你觉得没有问题，注明一下原因，修改状态，退出
3. 如果可修复，修复问题
4. 使用playwright-cli 验证问题, 如果没修好，重复第3步
5. 根据修复结果，修改状态，退出

修复过程中，如果需要，你也参考frontend工程

## frontend2 问题汇总

### 页面： http://localhost:3002/home

sidebar 下的用户avatar问题：

1. 未显示用户名和邮箱 - 已修复：login API现在正确获取user profile数据并存储到authStore
2. 未链接/profile页面 - 已修复：整个用户区域是可点击的链接

状态：修复成功

### 页面： http://localhost:3002/org-structure

组织架构：

1. 没有新增节点(增加root节点） - 已修复：新增按钮+添加子节点菜单
2. 针对某个组织架构，缺少以下功能

- 添加子节点 - 已修复：右键菜单添加子节点
- 编辑 - 已修复：右键菜单编辑
- 禁用 - 已修复：右键菜单切换状态
- 删除 - 已修复：右键菜单删除

3. 组织人数显示不对 - 已修复：从API获取

状态：修复成功

### 页面： http://localhost:3002/org-structure

员工列表:
添加、列表功能没有对接后端api - 部分修复，添加/列表已对接，编辑/删除已对接，调动/绑定/解绑未实现
缺少编辑、删除、调动、绑定、解绑等功能 - 编辑、删除已修复，调动、绑定、解绑未实现

状态：部分修复（编辑删除已对接API，调动、绑定、解绑功能复杂待后续实现）

### 页面： http://localhost:3002/org-structure

dashboard的总人数、在职人数、部门数都没有对接后端api - 已修复：从API获取
缺少入职中 - 已修复：添加入职中统计

状态：修复成功

### 页面： http://localhost:3002/skill-library

技能库页面：

1. 列表没有对接后端api - 已修复：使用skillApi.list()获取数据
2. 新增技能没有对接后端api - 已修复：使用skillApi.create()创建技能
3. 编辑技能没有对接后端api - 已修复：使用skillApi.update()更新技能
4. 删除技能没有对接后端api - 已修复：使用skillApi.delete()删除技能
5. 查看详情没有对接后端api - 已修复：使用skillApi.get()获取详情
6. 启用/禁用没有对接后端api - 已修复：使用skillApi.activate()/deactivate()

状态：修复成功

### 页面： http://localhost:3002/projects

项目管理页面：

1. 列表使用mock数据 - 已修复：使用projectApi.list()获取数据
2. 新建项目没有对接后端api - 已修复：使用projectApi.create()创建项目
3. 编辑项目没有对接后端api - 已修复：使用projectApi.update()更新项目
4. 启用/禁用没有对接后端api - 已修复：使用projectApi.update()切换状态
5. 归档没有对接后端api - 已修复：使用projectApi.update()归档项目

状态：修复成功
