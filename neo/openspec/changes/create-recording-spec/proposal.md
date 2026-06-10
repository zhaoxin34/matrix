## Why

Neo 平台的 Agent Steer 功能支持录制用户操作（rrweb 格式），但目前缺乏统一的录像管理能力。用户无法在 Workspace 下查看、重命名、标签管理、批量操作已录制的视频，也不支持手工上传视频文件。需要建立 Recording 资源体系，实现录像的持久化存储和完整生命周期管理。

## What Changes

- 在 Workspace 下新增 Recording 资源，包含多个 Segment（每 10 分钟生成一段）
- 支持录像的增删改查、重命名、标签管理
- 支持批量操作（批量删除、批量标签管理）
- 支持搜索筛选（按名称、标签、时间范围）
- 支持录像回放（rrweb Player，支持选择从哪个 Segment 开始播放）
- 支持手工上传视频文件（独立于 Agent Steer）
- 存储采用 S3 兼容存储，Presigned URL 方式上传/下载

## Capabilities

### New Capabilities

- `recording-management`: 录像管理能力，包括 Recording 和 Segment 的 CRUD、列表、搜索、批量操作、回放控制
- `recording-upload`: 录像上传能力，支持 Agent Steer 实时上传和手工上传两种模式
- `recording-playback`: 录像回放能力，支持多 Segment 连续播放和分段选择

### Modified Capabilities

- `rrweb-recording`: 现有 rrweb 录制能力需要适配新的 Segment 上传流程（每 10 分钟自动生成新段并上传）

## Impact

- **后端**: 新增 Recording 和 Segment 数据表，支持 S3 存储集成
- **API**: 新增 `/api/v1/workspaces/{code}/recordings` 系列 API
- **前端**: 新增录像列表页、详情页、回放页
- **存储**: 集成 S3 兼容存储（rustfs）
- **依赖**: Agent Steer 需要调用 Recording API 进行录像管理