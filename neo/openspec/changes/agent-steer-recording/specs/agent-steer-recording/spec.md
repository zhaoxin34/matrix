# agent-steer-recording Specification

## Purpose

定义 Chrome 扩展端"软件操作录像管理"能力：用户在 Popup 中控制录制的开启 / 暂停 / 继续 / 上传 / 清除；Content Script 负责采集 rrweb 事件、按 10 分钟或切 tab 边界分段写入 IndexedDB；Popup 在用户确认后调用后端已有 API 完成上传与本地清理。

**核心生命周期模型**：一次"开启录制 → 停止/上传" = 一个 session；session 可跨越多个 tab（用户切 tab 不结束 session，切 tab 仅作为 segment 边界）；全局同一时刻最多 1 个 active session。

**持久化模型**：录像在 IndexedDB 保留到用户主动上传；关闭浏览器后重开 popup 应能检测到未上传的 segment 并提供 Pending 状态。

本 capability 是后端 `recording-upload` 和 `recording-management` 的纯消费方，不修改任何后端能力。

## ADDED Requirements

### Requirement: Recording lifecycle control

The system SHALL provide popup-initiated start, pause, resume, and stop controls for a recording session. The active session SHALL be stored in `chrome.storage.session` keyed by `activeSessionId` so that newly-loaded tabs and re-opened popups can locate it.

#### Scenario: Start a fresh recording
- **WHEN** user clicks "开启录制" in popup and there is no active session in `chrome.storage.session.activeSessionId`
- **THEN** popup generates a new session identifier (UUID) and writes it to `chrome.storage.session.activeSessionId`
- **AND** popup sends `recording.start` command to the active tab's content script with the new sessionId
- **AND** content script starts an rrweb recorder with default configuration
- **AND** content script reports `recording.state` with `isRecording=true`, `isPaused=false`, `segmentCount=1`, `eventCount=0`
- **AND** popup UI transitions to Recording state showing duration and segment count

#### Scenario: Pause recording
- **WHEN** user clicks "暂停" while recording
- **THEN** popup sends `recording.pause` command
- **AND** content script stops the rrweb event handler
- **AND** content script flushes the current segment to IndexedDB
- **AND** content script reports `recording.state` with `isRecording=false`, `isPaused=true`

#### Scenario: Resume recording
- **WHEN** user clicks "继续录制" while paused
- **THEN** popup sends `recording.resume` command
- **AND** content script restarts the rrweb event handler with the same sessionId
- **AND** content script starts a new segment with a fresh 10-minute timer
- **AND** segment sequence SHALL continue from the previous segment's sequence number

#### Scenario: Stop recording (terminate session)
- **WHEN** user explicitly clicks "停止录制" (terminate) on a recording or paused session
- **THEN** popup sends `recording.stop` command
- **AND** content script stops the rrweb handler and flushes the current segment
- **AND** popup removes `activeSessionId` from `chrome.storage.session`
- **AND** popup SHALL ask the user to choose: upload now, or discard (clear local data)
- **AND** if the user discards, all segments for the session SHALL be deleted from IndexedDB
- **AND** if the user uploads, the upload workflow SHALL be initiated

### Requirement: Cross-tab recording continuity

The system SHALL allow a single recording session to span multiple browser tabs. Switching tabs SHALL NOT terminate the session; it SHALL only act as a segment boundary (current segment is flushed, new tab starts a new segment under the same sessionId).

#### Scenario: Switch tab during active recording
- **WHEN** user activates a different tab while a recording is active
- **THEN** the previously active tab's content script SHALL flush its current segment to IndexedDB with the current sessionId
- **AND** the previously active tab's content script SHALL stop its rrweb handler (no further events captured on the deactivated tab)
- **AND** the newly activated tab's content script SHALL detect the active session in `chrome.storage.session.activeSessionId`
- **AND** the newly activated tab's content script SHALL start an rrweb handler attached to the same sessionId
- **AND** a new segment SHALL be started on the newly activated tab with `sequence = previous + 1`
- **AND** the popup on either tab SHALL show Recording state (same active session)

#### Scenario: New tab inherits active session
- **WHEN** user opens a brand-new tab (or navigates to a new page) while a recording is active
- **THEN** the new tab's content script SHALL detect `chrome.storage.session.activeSessionId` and attach to the existing session
- **AND** a new segment SHALL be started under the same sessionId

#### Scenario: Multiple tabs share one session
- **WHEN** two or more tabs are open and a recording is active
- **THEN** only the currently focused tab SHALL run an rrweb handler
- **AND** at any time, at most one tab SHALL be the active recorder
- **AND** `chrome.storage.session.activeRecorderTabId` SHALL identify which tab is currently the recorder

#### Scenario: Tab close does not terminate session
- **WHEN** the tab currently acting as the active recorder is closed
- **THEN** the system SHALL NOT remove `activeSessionId` from `chrome.storage.session`
- **AND** if any other tab is open, the system SHALL consider promoting one of them to the active recorder (or wait for user to activate one)

### Requirement: Automatic segment generation

The system SHALL automatically finalize the current segment and start a new one at 10-minute intervals AND at tab-switch boundaries during an active recording session.

#### Scenario: Segment flush on 10-minute timer
- **WHEN** a recording has been continuously active (in the current tab) for 10 minutes
- **THEN** content script SHALL finalize the current segment with `endTime = now`
- **AND** content script SHALL write the segment to IndexedDB
- **AND** content script SHALL start a new segment with `startTime = now` and a fresh 10-minute timer

#### Scenario: Segment flush on tab switch
- **WHEN** user switches to a different tab while recording is active
- **THEN** content script SHALL finalize the current segment on the leaving tab with `endTime = switch time`
- **AND** content script on the entering tab SHALL start a new segment with `startTime = switch time`
- **AND** the new segment's `sequence` SHALL be the previous segment's `sequence + 1`

#### Scenario: Segment flush on pause
- **WHEN** user pauses a recording that has been active for less than 10 minutes
- **THEN** content script SHALL finalize the current segment with `endTime = pause time`
- **AND** the segment SHALL be written to IndexedDB even though it is shorter than 10 minutes

#### Scenario: Segment flush on stop
- **WHEN** user explicitly stops a recording
- **THEN** content script SHALL finalize the current segment with `endTime = stop time` if the segment has any events
- **AND** the segment SHALL be written to IndexedDB

### Requirement: IndexedDB segment persistence

The system SHALL persist each finalized segment to the `recording_segments` object store in the `neo-agent-recordings` IndexedDB database. Each segment record SHALL contain `uid`, `sessionId`, `sequence`, `startTime`, `endTime`, `events`, `pageUrls`, `createdAt`.

#### Scenario: Segment schema
- **WHEN** a segment is flushed
- **THEN** it SHALL be written with `uid` = UUID, `sequence` = monotonically increasing integer starting at 1, `events` = rrweb event array, `pageUrls` = unique URLs visited during the segment

#### Scenario: Retrieve segments by session
- **WHEN** popup requests segments for upload
- **THEN** content script SHALL read all segments where `sessionId` matches the current session, ordered by `sequence`

### Requirement: Pending segment recovery on browser restart

The system SHALL detect and present any unsynced recording segments from IndexedDB when the browser is restarted and the popup is opened, allowing the user to upload, discard, or start a new recording.

#### Scenario: Browser restart with unsynced segments
- **WHEN** user reopens the browser and clicks the popup on a tab
- **THEN** popup SHALL query IndexedDB for any segments where `sessionId` does NOT have a corresponding uploaded recording on the backend
- **AND** if unsynced segments exist, popup SHALL display a Pending state showing: segment count, total duration, original session start time
- **AND** popup SHALL offer three actions: "上传旧录像", "丢弃旧录像", "新开一段"

#### Scenario: Upload old recording from Pending state
- **WHEN** user clicks "上传旧录像" in Pending state
- **THEN** popup SHALL proceed to the standard Upload workflow with the existing session's segments

#### Scenario: Discard old recording from Pending state
- **WHEN** user clicks "丢弃旧录像" in Pending state
- **THEN** popup SHALL confirm with the user
- **AND** on confirmation, popup SHALL delete all segments belonging to the unsynced session from IndexedDB
- **AND** popup SHALL return to Idle state

#### Scenario: Start new recording from Pending state
- **WHEN** user clicks "新开一段" in Pending state
- **THEN** popup SHALL leave the old unsynced segments in IndexedDB (do NOT delete)
- **AND** popup SHALL start a new session with a fresh sessionId
- **AND** the popup SHALL transition to Recording state for the new session
- **AND** the old unsynced session remains recoverable (user can return to Pending state later or via another tab's popup)

### Requirement: rrweb event capture

The system SHALL use rrweb to capture DOM mutations, mouse, keyboard, scroll, and viewport-resize events on the active tab during a recording session.

#### Scenario: Capture DOM mutations
- **WHEN** the page DOM changes during a recording session
- **THEN** rrweb SHALL record the mutation type, affected nodes, and serialized node data
- **AND** the events SHALL be appended to the current in-memory segment buffer

#### Scenario: Capture user interactions
- **WHEN** user performs mouse, keyboard, scroll, or viewport-resize actions during a recording session
- **THEN** rrweb SHALL record the event with timestamp and target element

#### Scenario: Stop capture when not the active recorder
- **WHEN** recording is paused, stopped, or the current tab is not the active recorder
- **THEN** rrweb SHALL NOT record any further events until the tab becomes the active recorder again or the session is resumed

### Requirement: Emergency flush on page unload

The system SHALL attempt to persist the current in-memory segment when the page is being unloaded (refresh, navigation, tab close) while a recording is active, so that data is not lost. The session MAY remain active even if the current recorder tab closes.

#### Scenario: Flush before unload
- **WHEN** `beforeunload` fires and the current tab is the active recorder
- **THEN** content script SHALL synchronously write the current segment to IndexedDB before the page unloads
- **AND** if no other tab is open, `chrome.storage.session.activeRecorderTabId` SHALL be cleared (session remains in `activeSessionId` for the user to resume on a new tab)

### Requirement: Upload workflow

The system SHALL upload a paused recording's segments to the Neo backend by calling four backend APIs in sequence. The Popup SHALL be the sole orchestrator of the upload; the content script SHALL only provide segment data on request.

#### Scenario: Upload happy path
- **WHEN** user enters a recording name and confirms upload
- **THEN** popup SHALL call `POST /api/v1/workspaces/{workspace_code}/recordings` with `name`, `source="agent"`, `enterUrl` to obtain `recordingUid`
- **AND** for each segment ordered by `sequence`, popup SHALL call `POST /api/v1/workspaces/{workspace_code}/recordings/{recordingUid}/segments` with `sequence`, `startTime`, `endTime`, `pageUrls`, `storageKey`, `size` to obtain `segmentUid`
- **AND** popup SHALL call `POST /api/v1/workspaces/{workspace_code}/recordings/{recordingUid}/segments/presigned` with `filename`, `contentType` to obtain a presigned PUT URL
- **AND** popup SHALL PUT the segment's `events` as JSON to the presigned URL
- **AND** after all segments are uploaded, popup SHALL call `PUT /api/v1/workspaces/{workspace_code}/recordings/{recordingUid}` with `status="completed"`, `exitUrl`, `totalDuration`
- **AND** on success, popup SHALL clear the local IndexedDB segments for the session

#### Scenario: Storage key format
- **WHEN** a segment is uploaded
- **THEN** the `storageKey` SHALL follow `recordings/{workspace_code}/{recordingUid}/{segmentUid}.rrweb.json`

### Requirement: Upload failure and recovery

The system SHALL keep local IndexedDB segments intact when any upload step fails, and SHALL allow the user to retry the upload from the failed step without creating duplicate backend resources.

#### Scenario: Network failure mid-upload
- **WHEN** any of the four upload steps fails
- **THEN** popup SHALL display an error state with a retry option
- **AND** local IndexedDB segments SHALL remain available

#### Scenario: Idempotent retry
- **WHEN** user retries an upload that previously created the recording on the backend
- **THEN** popup SHALL reuse the previously obtained `recordingUid` for subsequent segment uploads
- **AND** popup SHALL skip segments that were already successfully uploaded

### Requirement: Workspace code configuration

The system SHALL read the target `workspace_code` from `chrome.storage.local` configuration before issuing any upload API call. If the configuration is missing, the popup SHALL display a configuration prompt and SHALL NOT initiate any upload.

#### Scenario: Missing workspace_code
- **WHEN** user attempts to upload and `workspace_code` is not configured
- **THEN** popup SHALL display a message directing the user to configure the workspace
- **AND** popup SHALL NOT call any backend API

#### Scenario: Configured workspace_code
- **WHEN** `workspace_code` is configured and user initiates upload
- **THEN** popup SHALL include it as a path parameter in all four upload API calls

### Requirement: State reporting

The system SHALL report recording state changes from the content script to the popup via `recording.state` events. The popup SHALL treat the content script as the single source of truth for recording state and SHALL render UI based on the most recent received state event.

#### Scenario: State update on lifecycle change
- **WHEN** content script's recording state changes (start, pause, resume, stop, tab-switch segment flush)
- **THEN** it SHALL send a `recording.state` event to popup with `isRecording`, `isPaused`, `duration`, `segmentCount`, `eventCount` reflecting the new state

#### Scenario: Popup re-syncs state on open
- **WHEN** popup opens
- **THEN** popup SHALL request current state from the active tab's content script
- **AND** SHALL render the UI based on the response

### Requirement: Recording duration tracking

The system SHALL track the cumulative duration of a recording session across pause/resume cycles and tab switches. The duration SHALL be the sum of all active (non-paused) intervals within the session, and SHALL be reported in `recording.state` events and used as `totalDuration` in the final `PUT` call.

#### Scenario: Duration excludes paused time
- **WHEN** recording is paused for 5 minutes and resumed
- **THEN** the reported `duration` SHALL NOT include the 5-minute paused interval

#### Scenario: Duration includes cross-tab time
- **WHEN** user records for 5 minutes in tab A then switches to tab B and records for 3 more minutes
- **THEN** the reported `duration` SHALL be 8 minutes (cross-tab time is included; tab switch is a segment boundary but not a pause)

#### Scenario: Total duration on completion
- **WHEN** upload completes
- **THEN** the `totalDuration` sent in the final `PUT` call SHALL equal the final reported `duration` value

### Requirement: Out of scope — long-idle handling

The system SHALL NOT auto-pause, auto-stop, or auto-save a recording session based on user inactivity (no mouse, keyboard, or other input) on the active recorder tab. This is intentionally out of scope for this change.

#### Scenario: Inactivity does not affect recording
- **WHEN** user is recording and does not perform any input on the active tab for an extended period (e.g. 30 minutes)
- **THEN** the recording SHALL continue without pause or stop
- **AND** rrweb events SHALL continue to be captured (e.g. passive DOM changes, network responses rendered to the page)
- **AND** the 10-minute segment timer SHALL continue running

#### Scenario: Future work deferred
- **NOTE** A future change MAY add: auto-pause on idle threshold, idle detection rules, user notifications, or auto-upload of stale recordings. These are NOT implemented in this change.
