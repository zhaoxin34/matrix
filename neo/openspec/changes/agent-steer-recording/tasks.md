# Tasks: Agent Steer Recording

实现按依赖顺序拆分为 11 个章节，每章节内的子任务独立可勾选。范围：**仅修改 `chrome-extension/`**，零后端 / 前端代码改动。

## 1. Configuration reader and type definitions

- [ ] 1.1 Create `chrome-extension/src/config/types.ts` defining `AgentSteerConfig` interface (fields: `workspace_code`, `api_base_url`, `frontend_base_url`)
- [ ] 1.2 Implement `chrome-extension/src/config/settings.ts` exporting `getConfig(): Promise<AgentSteerConfig>` reading from `chrome.storage.local`
- [ ] 1.3 Handle missing / partial-missing config: return a discriminated union `{ ok: true, config } | { ok: false, missing: string[] }`
- [ ] 1.4 Write unit tests covering: config present, missing entirely, partial-missing (e.g. only `workspace_code` set)
- [ ] 1.5 Run `make typecheck` and `make test:run` — both green

## 2. IndexedDB schema extension

- [ ] 2.1 Add v2 upgrade to `neo-agent-recordings` database in `chrome-extension/src/storage/db.ts`: create `recording_segments` object store with keyPath `uid`
- [ ] 2.2 Add indexes on `recording_segments`: `sessionId` (non-unique), `sequence` (non-unique), `synced` (non-unique) — last one needed for Pending state detection
- [ ] 2.3 Add `synced: 0` (unsynced) / `synced: 1` (uploaded) field to each segment record
- [ ] 2.4 Verify v1 → v2 migration preserves existing `recordings` object store data (no destruction)
- [ ] 2.5 Implement `chrome-extension/src/storage/segments.ts` exporting `putSegment`, `getSegmentsBySession`, `getUnsyncedSegments`, `markSegmentsSynced`, `deleteSegmentsBySession`, `getSegmentByUid`
- [ ] 2.6 Write integration tests with `fake-indexeddb`: write → query by sessionId → query unsynced → mark synced → delete → verify count
- [ ] 2.7 Run `make typecheck` and `make test:run` — both green

## 3. Messaging protocol foundation

- [ ] 3.1 Create `chrome-extension/src/messaging/protocol.ts` defining `RecordingCommand` and `RecordingEvent` discriminated union types (recording.start / pause / resume / stop / fetch / state / data)
- [ ] 3.2 Implement message factory functions: `makeCommand(type, payload)` and `makeEvent(type, payload)` that auto-fill `version`, `direction`, `timestamp`, `messageId`
- [ ] 3.3 Implement `chrome-extension/src/messaging/popup-client.ts` registering `recording` namespace with `@webext-core/messaging`
- [ ] 3.4 Implement `chrome-extension/src/messaging/content-handler.ts` with command router that dispatches by `type` to handler functions
- [ ] 3.5 Maintain `messageId → resolver` Promise map for request-response correlation (reusing `message-communication` capability's correlationId pattern)
- [ ] 3.6 Write unit tests: serialize/deserialize round-trip, unknown type returns error, malformed message rejected
- [ ] 3.7 Run `make typecheck` and `make test:run` — both green

## 4. Content Script recording controller

- [ ] 4.1 Create `chrome-extension/src/recording/rrweb-runner.ts` wrapping `rrweb.record({ emit, ... })` with `start()` and `stop()` methods
- [ ] 4.2 Create `chrome-extension/src/recording/segmenter.ts` with internal `events: rrwebEvent[]` buffer and `pageUrls: Set<string>` tracker
- [ ] 4.3 Implement 10-minute auto-flush timer in segmenter; pause/resume/stop trigger immediate flush
- [ ] 4.4 Add `beforeunload` listener in segmenter for emergency flush (use synchronous IDB write)
- [ ] 4.5 Create `chrome-extension/src/recording/controller.ts` implementing the recording state machine (Idle → Recording → Paused → ...)
- [ ] 4.6 Wire controller to messaging handlers: respond to `recording.start/pause/resume/stop/fetch`, emit `recording.state` and `recording.data` events
- [ ] 4.7 Implement `flushForTabSwitch()` method in segmenter: explicitly flush current segment without stopping the timer (caller decides)
- [ ] 4.8 Add `visibilitychange` listener in content script: when tab becomes hidden, call `flushForTabSwitch()` and stop rrweb; when becomes visible, check `chrome.storage.session.activeRecorderTabId` and start rrweb if it's self
- [ ] 4.9 Mount controller in `entrypoints/content.ts` (single instance per tab)
- [ ] 4.10 Write unit tests: segmenter flush at 10min / on pause / on stop / on tab-switch; controller state transitions per design §2
- [ ] 4.11 Write integration tests with jsdom + fake-indexeddb: send `start` → receive `state` event with correct fields; `pause` → `resume` continues sequence; simulate tab visibility change → flush
- [ ] 4.12 Run `make typecheck`, `make lint`, and `make test:run` — all green

## 4.5. Cross-tab session coordinator

- [ ] 4.5.1 Create `chrome-extension/src/session/storage.ts` wrapping `chrome.storage.session` for reading/writing `activeSessionId` and `activeRecorderTabId`
- [ ] 4.5.2 Create `chrome-extension/src/session/coordinator.ts` exporting `getActiveSession()`, `setActiveSession(id)`, `clearActiveSession()`, `getActiveRecorderTabId()`, `setActiveRecorderTabId(tabId)`, `clearActiveRecorderTabId()`
- [ ] 4.5.3 Create `chrome-extension/entrypoints/background.ts` (or extend existing) registering `chrome.tabs.onActivated` listener: notify the leaving tab to flush + stop rrweb, notify the entering tab to start rrweb
- [ ] 4.5.4 In background, register `chrome.tabs.onRemoved` listener: if the removed tab is `activeRecorderTabId`, clear `activeRecorderTabId` (keep `activeSessionId` so other tabs can take over)
- [ ] 4.5.5 In content script startup, call `getActiveSession()` and `getActiveRecorderTabId()`: if session exists and recorder is null (because the previous recorder tab was closed), this tab SHALL auto-become the new recorder and start rrweb
- [ ] 4.5.6 Add message types to `protocol.ts`: `tab.becomeRecorder` (background → content script) and `tab.flushAndStop` (background → content script)
- [ ] 4.5.7 Write unit tests for coordinator with mocked `chrome.storage.session` and `chrome.tabs.*` APIs: set/clear session, set/clear recorder tabId, multi-tab simulation
- [ ] 4.5.8 Write integration test simulating 2 tabs: tab A starts recording → background fires `onActivated(tab B)` → tab A flushes + stops, tab B starts → verify `activeRecorderTabId = tab B`
- [ ] 4.5.9 Run `make typecheck`, `make lint`, and `make test:run` — all green

## 5. Popup state machine and views

- [ ] 5.1 Configure WXT popup entry in `wxt.config.ts` if not already registered
- [ ] 5.2 Create `chrome-extension/entrypoints/popup/App.tsx` driven by `useRecordingState()` hook
- [ ] 5.3 Create `chrome-extension/entrypoints/popup/states/Idle.tsx` (shows "开启录制" button)
- [ ] 5.4 Create `chrome-extension/entrypoints/popup/states/Recording.tsx` (shows duration, segment count, "暂停" button, red recording dot)
- [ ] 5.5 Create `chrome-extension/entrypoints/popup/states/Paused.tsx` (shows "继续录制" and "上传" buttons, fills name input on upload)
- [ ] 5.6 Create `chrome-extension/entrypoints/popup/states/Uploading.tsx` (shows spinner / progress)
- [ ] 5.7 Create `chrome-extension/entrypoints/popup/states/Success.tsx` (shows "查看回放" button)
- [ ] 5.8 Create `chrome-extension/entrypoints/popup/states/Error.tsx` (shows error message + "重试" button)
- [ ] 5.9 Create `chrome-extension/entrypoints/popup/states/Pending.tsx` (shows unsynced segment info, "上传旧录像" / "丢弃旧录像" / "新开一段" buttons)
- [ ] 5.10 Create `chrome-extension/entrypoints/popup/states/PendingSessionPicker.tsx` (modal/dialog for selecting which unsynced session to upload when multiple exist)
- [ ] 5.11 Implement `useRecordingState()` hook in `hooks/useRecordingState.ts`: on mount, (a) detect Pending state from IndexedDB, (b) request current state from active tab's content script; subscribe to subsequent `recording.state` events
- [ ] 5.12 Write snapshot tests for each state view (match product design §UI 设计 pixel-by-pixel)
- [ ] 5.13 Manual verification: `make dev` + load extension → popup UI matches product design screenshots
- [ ] 5.14 Run `make typecheck`, `make lint`, and `make test:run` — all green

## 6. Upload API client

- [ ] 6.1 Create `chrome-extension/src/upload/api-client.ts` with four functions: `createRecording(workspaceCode, body)`, `createSegment(workspaceCode, recordingUid, body)`, `getPresignedUploadUrl(workspaceCode, recordingUid, body)`, `markCompleted(workspaceCode, recordingUid, body)`
- [ ] 6.2 Implement unified `UploadApiError` class carrying `httpStatus`, `backendMessage`, `retryable: boolean`
- [ ] 6.3 Add retry classification: 5xx and network errors → `retryable: true`; 4xx → `retryable: false`
- [ ] 6.4 Write unit tests mocking fetch: each function covers 200, 4xx, 5xx, network-error
- [ ] 6.5 Verify request/response shapes match `recording-upload` and `recording-management` capability specs
- [ ] 6.6 Run `make typecheck`, `make lint`, and `make test:run` — all green

## 7. Upload service orchestration

- [ ] 7.1 Create `chrome-extension/src/upload/service.ts` implementing `uploadRecording(name, segments, workspaceCode)` — the 4-step flow per design §6
- [ ] 7.2 Persist upload progress to `chrome.storage.local.upload_progress`: `{ recordingUid, uploadedSegmentUids: string[] }` after each successful step
- [ ] 7.3 Implement idempotent retry: on retry, reuse `recordingUid` and skip segments whose UIDs are in `uploadedSegmentUids`
- [ ] 7.4 After final `PUT` (mark completed), call `deleteSegmentsBySession` to clear local IndexedDB data
- [ ] 7.5 On any non-retryable error mid-flow: throw and preserve local data + progress state
- [ ] 7.6 Write unit tests: happy path all 4 steps, mid-upload 5xx error, mid-upload 4xx error, retry skipping already-uploaded segments
- [ ] 7.7 Run `make typecheck`, `make lint`, and `make test:run` — all green

## 8. Popup upload flow

- [ ] 8.1 Add upload button in `Paused.tsx` that opens a name-input dialog (overlay or modal)
- [ ] 8.2 Implement `chrome-extension/entrypoints/popup/hooks/useUpload.ts` orchestrating `uploadRecording()` + state transitions
- [ ] 8.3 Transition to `Uploading` state on upload start, `Success` on success, `Error` on failure
- [ ] 8.4 Add "查看回放" button in `Success.tsx` that opens `${frontend_base_url}/workspaces/${workspace_code}/recordings/${recordingUid}` in new tab
- [ ] 8.5 Add "重试" button in `Error.tsx` that re-invokes `useUpload` with cached name
- [ ] 8.6 Manual e2e: enable recording → perform actions → pause → upload → verify recording visible in Neo frontend
- [ ] 8.7 Manual e2e: simulate network failure (devtools offline) mid-upload → Error state → re-enable network → retry succeeds
- [ ] 8.8 Run `make typecheck`, `make lint`, and `make test:run` — all green

## 9. Error handling and edge cases

- [ ] 9.1 Confirm `beforeunload` listener flushes current segment before page unload (regression test for 4.4)
- [ ] 9.2 Handle `QuotaExceededError` from IndexedDB writes: emit `recording.state` with `error: 'STORAGE_FULL'`
- [ ] 9.3 Handle IndexedDB `VersionError` (DB locked by another tab): emit `error: 'INTERNAL'`
- [ ] 9.4 Upload service distinguishes retryable (5xx, network) vs non-retryable (4xx) errors
- [ ] 9.5 Tab close during active recording: emergency flush fires, session terminates, popup for that tab reports `isRecording=false`
- [ ] 9.6 Write unit tests for 9.2, 9.3, 9.4
- [ ] 9.7 Manual e2e: refresh page during recording → reopen popup → see segments preserved → upload succeeds
- [ ] 9.8 Run `make typecheck`, `make lint`, and `make test:run` — all green

## 10. Unit test coverage and code quality

- [ ] 10.1 Run full test suite `make test:run` — all green
- [ ] 10.2 Generate coverage report (if configured in project): new code under `src/recording/`, `src/upload/`, `src/messaging/` ≥ 80%
- [ ] 10.3 Run `make typecheck` — zero errors
- [ ] 10.4 Run `make lint` — zero warnings (or all justified)
- [ ] 10.5 Run `make format` — clean
- [ ] 10.6 Run `/simplify` — review and apply suggested simplifications

## 11. End-to-end tests

- [ ] 11.1 Create e2e test file at `e2e-test/testcases/chrome-extension/agent-steer-recording.spec.ts` (or per project convention)
- [ ] 11.2 Case A (smoke): start recording → wait ≥10s → pause → upload → verify Neo DB has recording + ≥1 segment with correct pageUrls
- [ ] 11.3 Case B (page unload): start recording → refresh page → verify `beforeunload` flush → pause after reopen → upload succeeds with preserved segment
- [ ] 11.4 Case C (cross-tab continuity): start recording in tab A → record ≥5s → switch to tab B → record ≥5s → pause → verify 2 segments under same sessionId, ordered by sequence
- [ ] 11.5 Case D (new tab inherits session): start recording in tab A → close tab A → open new tab → verify new tab auto-becomes active recorder (popup shows Recording state, segment count starts at previous+1)
- [ ] 11.6 Case E (browser restart Pending): start recording → record a segment → close browser → reopen → click popup → verify Pending state with correct segment count → upload → verify backend has recording
- [ ] 11.7 Case F (Pending → start new): same setup as E → instead of upload, click "新开一段" → verify old segments remain in IndexedDB, new session starts (verify by checking new recording's sessionId differs)
- [ ] 11.8 Case G (network failure): start upload → simulate network failure → Error state → restore network → retry → success
- [ ] 11.9 Run full e2e suite against neo backend (Cases A–G all pass)
- [ ] 11.10 Capture screenshots of each popup state (including new Pending state) for product team review