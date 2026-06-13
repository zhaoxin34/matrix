## Why

Chrome 插件 Agent Steer 需要提供软件操作录像功能。用户通过 Popup 界面控制录制的开始、暂停、上传等操作，并能够回放录像学习操作流程。

## What Changes

- 实现 Agent Steer Chrome 插件的 Popup 界面，包含多种状态（Idle、Recording、Paused、Pending、AuthRequired）
- 实现上传录像的流程界面（输入名称、确认上传、结果显示）
- 实现录像回放查看入口（跳转到 Neo Frontend）
- 状态转换的 UI 层面展示（不实现具体录制逻辑）

## Capabilities

### New Capabilities

- `popup-recording-ui`: Popup 界面的 UI 组件和状态展示，包括：
  - Idle 状态（未开启录制）
  - Recording 状态（录制中，显示时长和片段数）
  - Paused 状态（已暂停，显示操作按钮）
  - Pending 状态（存在未上传录像）
  - AuthRequired 状态（未登录或未选工作区）
  - 上传流程 UI（输入名称、确认上传、成功/失败提示）
  - 查看回放入口

### Modified Capabilities

- 无（现有 `rrweb-recording` spec 已定义录制逻辑，这里只做 UI 展示）

## Impact

- **新增文件**: `agent-steer/src/popup/` 目录下的 React 组件
- **依赖**:
  - 使用 `rrweb-recording` 定义的录制状态接口（后续实现）
  - 使用 `recording-upload` 定义的上传 API（后续实现）
  - 复用 Neo Frontend 的登录态（通过 iframe）
- **界面改动**: 仅涉及 Popup 页面，不影响主页面