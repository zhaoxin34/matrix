## Context

Neo 平台的 Agent Steer 功能支持录制用户操作（rrweb 格式）。目前录制数据通过 Content Script 存储在 IndexedDB 中，缺乏统一的录像管理能力。

**当前状态**：
- Agent Steer 可录制用户操作并存储 rrweb 数据
- 无统一的录像列表、详情、搜索功能
- 无持久化存储，刷新页面后数据丢失
- 无回放、标签管理、批量操作能力

**约束**：
- 用户 ID 类型为 INT（与 users 表一致）
- 使用 S3 兼容存储（rustfs）
- 遵循项目 API 规范（标准响应结构、错误码体系）
- 松耦合设计，Agent Steer 通过 API 调用管理录像

## Goals / Non-Goals

**Goals:**
- 建立 Recording 资源体系，支持完整的录像生命周期管理
- 实现录像的持久化存储（Segment → S3）
- 提供统一的 CRUD、搜索、批量操作 API
- 支持录像回放（rrweb Player）
- 支持两种录入模式：Agent Steer 录制、手工上传

**Non-Goals:**
- 不实现录像的剪辑、合并功能
- 不实现录像的权限共享（暂由 Workspace 级别控制）
- 不实现录像的压缩、转码

## Decisions

### Decision 1: 数据模型 - Recording + Segment 双表设计

**选择**：Recording 作为主资源，Segment 作为子资源（1:N）。

**理由**：
- 一个 Recording 包含多个 Segment（每 10 分钟一段）
- 每个 Segment 独立存储在 S3，可单独管理和回放
- 支持跨段连续播放和分段选择

**替代方案**：
- 单表设计：将所有段合并为一个大 JSON 存储 → 不支持分段回放和增量上传
- 纯 S3 元数据：只存储 S3 路径 → 无法支持搜索、标签等元数据查询

### Decision 2: 存储方案 - S3 Presigned URL

**选择**：使用 Presigned URL 进行文件上传/下载。

**理由**：
- 解耦前后端与 S3 存储，后端无需中转大文件
- 支持分片上传，适合大文件
- 安全性高，URL 有时效限制

**替代方案**：
- 后端代理上传 → 后端成为瓶颈，无法支持大文件
- Service Account 直连 → 权限过大，风险高

### Decision 3: 松耦合架构 - API 解耦

**选择**：Agent Steer 通过标准 API 创建和管理 Recording，不依赖内部实现。

**理由**：
- 支持多来源录入（Agent Steer + 手工上传）
- Recording 服务可独立演进
- 前端页面和 Agent Steer 共用同一套 API

### Decision 4: Segment 上传时机 - 每 10 分钟自动生成

**选择**：使用 rrweb 的 `checkoutEveryNms` 配置，每 10 分钟触发新段。

**理由**：
- rrweb 原生支持，触发可靠
- 每段开始自动生成 full snapshot，保证可回放性
- 避免单文件过大

### Decision 5: API 路由设计 - 统一使用 workspace_code 路径

**选择**：所有 API 使用 `/api/v1/workspaces/{workspace_code}/recordings/...` 路径。

**理由**：
- 符合项目 API 规范
- 便于权限校验（workspace 级别）
- 路由结构一致

## Risks / Trade-offs

### Risk: S3 存储成本
- **描述**：大量录像存储可能产生较高 S3 成本
- ** Mitigation**：Segment 按需加载回放，不一次性加载全部数据

### Risk: 跨段回放连续性
- **描述**：段之间可能存在时间间隙（网络延迟、上传失败）
- ** Mitigation**：每段包含 startTime/endTime，可检测间隙；回放时显示时间轴

### Risk: 失败 Recording 清理
- **描述**：录制中断可能导致大量不完整录像
- ** Mitigation**：提供手动删除功能；可设置定时清理策略（待定）

### Risk: 前端回放性能
- **描述**：大量 Segment 可能影响加载时间
- ** Mitigation**：详情页显示段列表，用户可选择性加载；回放时按需加载

## Migration Plan

### Phase 1: 后端实现
1. 创建 recording 和 segment 数据表
2. 实现 Recording CRUD API
3. 实现 Segment 管理 API
4. 实现 Presigned URL 生成
5. 实现 S3 存储集成

### Phase 2: Agent Steer 集成
1. 修改录制流程：开始时创建 Recording
2. 每 10 分钟生成新 Segment 并上传
3. 停止时更新 Recording 状态

### Phase 3: 前端实现
1. 实现录像列表页
2. 实现录像详情页
3. 实现录像回放页（rrweb Player）
4. 实现批量操作功能

### Rollback Strategy
- 数据库变更：保留迁移脚本，可回滚
- API 变更：保持 API 向后兼容，渐进式迁移
- S3 文件：保留 30 天后删除

## Open Questions

1. **S3 凭证管理**：使用 Presigned URL 还是 Service Account？
2. **文件大小限制**：单个 Segment 最大多少？单个 Recording 最大多少段？
3. **清理策略**：失败的 Recording 是否需要自动清理？
4. **回放 API**：是否需要提供合并后的回放数据接口？