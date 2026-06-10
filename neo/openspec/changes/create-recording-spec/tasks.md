## 1. 数据库实现

- [ ] 1.1 创建 recording 表（参考 design.md 7.1 节 DDL）
- [ ] 1.2 创建 segment 表（参考 design.md 7.2 节 DDL）
- [ ] 1.3 添加数据库索引和约束

## 2. 后端 API 实现

### 2.1 Recording CRUD

- [ ] 2.1.1 实现 GET /api/v1/workspaces/{workspace_code}/recordings（列表）
- [ ] 2.1.2 实现 GET /api/v1/workspaces/{workspace_code}/recordings/{uid}（详情）
- [ ] 2.1.3 实现 POST /api/v1/workspaces/{workspace_code}/recordings（创建）
- [ ] 2.1.4 实现 PUT /api/v1/workspaces/{workspace_code}/recordings/{uid}（更新）
- [ ] 2.1.5 实现 DELETE /api/v1/workspaces/{workspace_code}/recordings/{uid}（删除）

### 2.2 Segment 管理

- [ ] 2.2.1 实现 POST /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments（创建段）
- [ ] 2.2.2 实现 GET /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments（列表段）

### 2.3 Presigned URL

- [ ] 2.3.1 实现 POST .../segments/presigned（获取上传 URL）
- [ ] 2.3.2 实现 GET .../segments/{segmentUid}/download-url（获取下载 URL）

### 2.4 批量操作

- [ ] 2.4.1 实现 PUT /api/v1/workspaces/{workspace_code}/recordings/batch/tags（批量标签）
- [ ] 2.4.2 实现 DELETE /api/v1/workspaces/{workspace_code}/recordings/batch（批量删除）

## 3. S3 存储集成

- [ ] 3.1 集成 S3 兼容存储（rustfs）
- [ ] 3.2 实现 Presigned URL 生成逻辑
- [ ] 3.3 实现 S3 文件删除（删除 Recording 时级联删除 Segment 文件）

## 4. Agent Steer 集成

- [ ] 4.1 修改录制开始逻辑（创建 Recording 并存储 uid）
- [ ] 4.2 配置 rrweb checkoutEveryNms=10分钟
- [ ] 4.3 实现 Segment 生成和上传流程
- [ ] 4.4 实现 pageUrls 收集逻辑
- [ ] 4.5 修改录制停止逻辑（更新 Recording 状态）

## 5. 前端实现

### 5.1 录像列表页

- [ ] 5.1.1 实现录像列表组件
- [ ] 5.1.2 实现搜索筛选功能（名称、标签、时间范围）
- [ ] 5.1.3 实现分页和排序

### 5.2 录像详情页

- [ ] 5.2.1 实现录像详情展示（基本信息、Segment 列表）
- [ ] 5.2.2 实现重命名功能
- [ ] 5.2.3 实现标签管理（添加/移除）
- [ ] 5.2.4 实现删除功能（二次确认）

### 5.3 录像回放页

- [ ] 5.3.1 集成 rrweb Player
- [ ] 5.3.2 实现播放/暂停/进度拖拽
- [ ] 5.3.3 实现 Segment 列表展示
- [ ] 5.3.4 实现从指定 Segment 开始播放

### 5.4 批量操作

- [ ] 5.4.1 实现批量选择功能
- [ ] 5.4.2 实现批量删除功能
- [ ] 5.4.3 实现批量添加/移除标签

### 5.5 手工上传

- [ ] 5.5.1 实现文件选择和上传
- [ ] 5.5.2 实现多文件上传（多个 Segment）

## 6. 测试

- [ ] 6.1 编写 Recording CRUD 单元测试
- [ ] 6.2 编写 Segment 管理单元测试
- [ ] 6.3 编写 Presigned URL 单元测试
- [ ] 6.4 编写 e2e 测试用例
- [ ] 6.5 测试 Agent Steer 录制流程
- [ ] 6.6 测试回放功能

### 6.7 代码质量检查

- [ ] 6.7.1 运行后端 lint 检查（ruff/flake8）
- [ ] 6.7.2 运行后端 format 检查（black/isort）
- [ ] 6.7.3 运行后端 typecheck（mypy）
- [ ] 6.7.4 运行前端 lint 检查（eslint）
- [ ] 6.7.5 运行前端 format 检查（prettier）
- [ ] 6.7.6 运行前端 typecheck（tsc）

## 7. 文档更新

- [ ] 7.1 更新 API 文档
- [ ] 7.2 更新路由表（routing-table.md）
- [ ] 7.3 更新产品文档（如需要）