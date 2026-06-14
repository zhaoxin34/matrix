# Tasks: Agent Steer Recording Upload

Implementation checklist for Chrome Extension recording and upload functionality.

## 1. Infrastructure Setup

- [x] 1.1 Create directory structure: `src/recording/db/`, `src/recording/cs/`, `src/recording/sw/`
- [x] 1.2 Move/update `src/recording/types.ts` with all shared types
- [x] 1.3 Update `src/recording/index.ts` to export new modules
- [x] 1.4 Configure Vite to copy `rrweb-bridge.js` to output

## 2. IndexedDB Storage (`src/recording/db/indexeddb.ts`)

- [x] 2.1 Implement `initDB()` - create IndexedDB with `segments` store
- [x] 2.2 Implement `createSegment()` - save segment with UUID and metadata
- [x] 2.3 Implement `getSegment(uid)` - retrieve single segment
- [x] 2.4 Implement `listSegmentsBySession(sessionId)` - get all segments for session
- [x] 2.5 Implement `getUnsyncedSegments()` - query pending uploads
- [x] 2.6 Implement `markSegmentSynced(uid)` - update sync status
- [x] 2.7 Implement `deleteSegment(uid)` - remove segment
- [x] 2.8 Implement `getActiveSession()` - detect session on load

## 3. Content Script Recording Logic (`src/recording/cs/recorder.ts`)

- [x] 3.1 Implement `startRecording()` - inject rrweb-bridge.js, init rrweb
- [x] 3.2 Implement `pauseRecording()` - set paused flag via postMessage
- [x] 3.3 Implement `resumeRecording()` - clear paused flag via postMessage
- [x] 3.4 Implement `stopRecording()` - finalize segment, stop rrweb
- [x] 3.5 Implement `pollForCommands()` - poll chrome.storage.local every 500ms
- [x] 3.6 Implement `updateRecordingState()` - write state to chrome.storage
- [x] 3.7 Update `entrypoints/content.ts` to use new recorder module

## 4. rrweb-bridge.js (`public/rrweb-bridge.js`)

- [x] 4.1 Create `rrweb-bridge.js` with `window.RRwebBridge` API
- [x] 4.2 Implement `initRecorder()` - setup rrweb.record() with event handler
- [x] 4.3 Implement `flushSegment()` - finalize and save segment to IndexedDB
- [x] 4.4 Implement 10-minute auto-flush timer
- [x] 4.5 Implement `handleCommand(type)` - process pause/resume/stop commands
- [x] 4.6 Implement `notifySegmentFlushed(segmentId)` - postMessage to content script

## 5. Service Worker Upload Logic (`src/recording/sw/uploader.ts`)

- [x] 5.1 Implement `initUploader()` - setup storage listeners
- [x] 5.2 Implement `pollForUploadCommands()` - poll for upload.cmd changes
- [x] 5.3 Implement `createRecording(workspaceCode, enterUrl)` - call POST /recordings
- [x] 5.4 Implement `uploadSegment(segment, recordingUid)` - call PUT /segments/bytes
- [x] 5.5 Implement `completeRecording(recordingUid, exitUrl)` - call POST /complete
- [x] 5.6 Implement `updateProgress(progress)` - write to chrome.storage
- [x] 5.7 Implement `handleUploadError(error)` - retry logic
- [x] 5.8 Update `entrypoints/background.ts` to use new uploader module

## 6. Popup UI Integration

- [x] 6.1 Update `useRecordingState.ts` to read/write recording commands
- [x] 6.2 Add `openNeo()` to navigate to playback URL after upload
- [x] 6.3 Add segment count and duration display in RecordingView
- [x] 6.4 Add PendingView for unsynced segments on startup
- [x] 6.5 Add Discard functionality in PausedView/PendingView

## 7. End-to-End Testing

- [ ] 7.1 Test: Start recording → verify rrweb starts
- [ ] 7.2 Test: Wait 10 minutes → verify segment auto-flush
- [ ] 7.3 Test: Stop recording → verify segments in IndexedDB
- [ ] 7.4 Test: Upload → verify Neo API called correctly
- [ ] 7.5 Test: View playback → verify correct URL
- [ ] 7.6 Test: Browser restart → verify pending segments detected

## 8. Test Authentication Mode

- [x] 8.1 Add ENV=test config to backend
- [x] 8.2 Add TEST_TOKEN and TEST_USER_ID to backend config
- [x] 8.3 Update dependencies.py to accept test token
- [x] 8.4 Create test user script (13800138002)
- [x] 8.5 Add testMode config to frontend storage
- [x] 8.6 Update iframe-bridge to return test user in test mode

## 9. Edge Cases

- [ ] 8.1 Handle IndexedDB quota exceeded
- [ ] 8.2 Handle Service Worker sleep/wake cycle
- [ ] 8.3 Handle network timeout during upload
- [ ] 8.4 Handle tab close during active recording
- [ ] 8.5 Verify multiple rapid start/stop doesn't create duplicate segments
