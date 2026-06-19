# popup-recording-ui Specification

## Purpose

定义 Agent Steer Chrome 插件 Popup 界面的 UI 组件规格，包括状态展示、控制按钮和上传流程。

## Requirements

### Requirement: AuthRequired State

当用户未登录 Neo Frontend 或未选择工作区时，Popup 应显示认证提示。

#### Scenario: Display auth required message
- **WHEN** Popup detects user is not logged in to Neo Frontend
- **THEN** Popup SHALL display "请先登录 Neo" message
- **AND** Popup SHALL show "打开 Neo" button to open Neo Frontend
- **AND** Popup SHALL show "重试" button to retry connection

#### Scenario: Display workspace selection prompt
- **WHEN** Popup detects user is logged in but no workspace selected
- **THEN** Popup SHALL display "请先在 Neo 中选择工作区" message
- **AND** Popup SHALL show "打开 Neo" button

#### Scenario: Display connection timeout error
- **WHEN** Popup fails to connect to Neo iframe after 5 seconds
- **THEN** Popup SHALL display "无法连接到 Neo，请检查网络" message
- **AND** Popup SHALL show "重试" button

### Requirement: Idle State

当用户未开启录制时，Popup 应显示空闲状态和开始录制按钮。

#### Scenario: Display idle state
- **WHEN** RecordingState.isRecording is false and auth is verified
- **THEN** Popup SHALL display idle view
- **AND** Popup SHALL show "开始录制" button
- **AND** Popup SHALL hide recording duration and segment count

### Requirement: Recording State

当录制进行中时，Popup 应显示录制状态信息。

#### Scenario: Display recording status
- **WHEN** RecordingState.isRecording is true and isPaused is false
- **THEN** Popup SHALL display "录制中" status indicator
- **AND** Popup SHALL display formatted duration (HH:MM:SS)
- **AND** Popup SHALL display segment count
- **AND** Popup SHALL show "暂停" button

#### Scenario: Update duration in real-time
- **WHEN** RecordingState.duration changes
- **THEN** Popup SHALL update duration display every 1 second

### Requirement: Paused State

当录制暂停时，Popup 应显示暂停状态和操作选项。

#### Scenario: Display paused state
- **WHEN** RecordingState.isPaused is true
- **THEN** Popup SHALL display "已暂停" status indicator
- **AND** Popup SHALL display last recorded duration
- **AND** Popup SHALL display segment count
- **AND** Popup SHALL show "继续录制" button
- **AND** Popup SHALL show "上传" button
- **AND** Popup SHALL show "清除" button

### Requirement: Pending State

当浏览器重启后存在未上传录像时，Popup 应提示用户处理。

#### Scenario: Display pending state on startup
- **WHEN** Popup initializes and IndexedDB contains unuploaded segments
- **THEN** Popup SHALL display "有待上传的录像" message
- **AND** Popup SHALL show segment count
- **AND** Popup SHALL show "上传" button
- **AND** Popup SHALL show "丢弃" button
- **AND** Popup SHALL show "新开一段" button

### Requirement: Upload Flow

用户可以输入录像名称并上传录像。

#### Scenario: Display upload form
- **WHEN** User clicks "上传" button from Paused or Pending state
- **THEN** Popup SHALL switch to upload form view
- **AND** Popup SHALL display text input for recording name
- **AND** Popup SHALL show "取消" button
- **AND** Popup SHALL show "确认上传" button

#### Scenario: Validate upload name
- **WHEN** User clicks "确认上传" with empty name
- **THEN** Popup SHALL display validation error "请输入录像名称"
- **AND** Popup SHALL disable confirm button until name is provided

#### Scenario: Display uploading progress
- **WHEN** User confirms upload and upload starts
- **THEN** Popup SHALL display "上传中..." status
- **AND** Popup SHALL display upload progress percentage
- **AND** Popup SHALL show progress bar

#### Scenario: Display upload success
- **WHEN** Upload completes successfully
- **THEN** Popup SHALL display "✅ 上传成功" message
- **AND** Popup SHALL show "查看回放" button
- **AND** Popup SHALL navigate to Neo Frontend recording page when clicked

#### Scenario: Display upload error
- **WHEN** Upload fails
- **THEN** Popup SHALL display "上传失败" message with error details
- **AND** Popup SHALL show "重试" button
- **AND** Popup SHALL show "取消" button

### Requirement: Control Actions

用户可以通过 Popup 控制录制行为。

#### Scenario: Start recording
- **WHEN** User clicks "开始录制" in Idle state
- **THEN** Popup SHALL send recording.start command via chrome.storage
- **AND** Popup SHALL update UI to Recording state

#### Scenario: Pause recording
- **WHEN** User clicks "暂停" in Recording state
- **THEN** Popup SHALL send recording.pause command via chrome.storage
- **AND** Popup SHALL update UI to Paused state

#### Scenario: Resume recording
- **WHEN** User clicks "继续录制" in Paused state
- **THEN** Popup SHALL send recording.resume command via chrome.storage
- **AND** Popup SHALL update UI to Recording state

#### Scenario: Clear local segments
- **WHEN** User clicks "清除" in Paused state
- **THEN** Popup SHALL display confirmation dialog "确定要清除本地录像数据吗？"
- **AND** Popup SHALL clear IndexedDB segments on confirmation
- **AND** Popup SHALL reset UI to Idle state

### Requirement: State Synchronization

Popup 应通过 chrome.storage 与 Content Script 同步状态。

#### Scenario: Sync recording state on change
- **WHEN** chrome.storage.onChanged fires for recording.state key
- **THEN** Popup SHALL update UI to reflect new RecordingState
- **AND** Popup SHALL trigger re-render with new state

#### Scenario: Display loading on initialization
- **WHEN** Popup initializes
- **THEN** Popup SHALL display loading indicator while fetching initial state
- **AND** Popup SHALL fetch RecordingState from chrome.storage.local