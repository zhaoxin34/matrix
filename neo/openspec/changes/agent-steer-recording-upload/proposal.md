# Proposal: Agent Steer Recording Upload

## Why

Agent Steer Chrome extension needs to implement actual recording and upload functionality. The popup UI is complete with authentication via iframe bridge, but the core recording logic (rrweb integration, IndexedDB storage, and Neo backend upload) is not yet implemented.

## What Changes

### New Capabilities

1. **rrweb Recording Integration**
   - Inject rrweb-bridge.js into page main world via Service Worker
   - Start/pause/resume/stop recording via chrome.storage commands
   - Segment management with 10-minute auto-flush timer

2. **IndexedDB Storage**
   - Store segments locally in IndexedDB
   - Track recording sessions and sync status
   - Handle browser restart (detect unsynced segments on startup)

3. **Service Worker Upload**
   - Read segments from IndexedDB
   - Upload to Neo backend via REST API
   - Progress tracking and error handling

4. **Popup ↔ Background Communication**
   - Use chrome.storage as state sync channel
   - Content Script polls for commands
   - Service Worker manages upload workflow

### Modified Capabilities

None - this is purely additive implementation.

## Capabilities

### New Capabilities

- `chrome-recording-engine`: Chrome extension recording logic - rrweb integration in content script, segment management, command handling via storage
- `chrome-storage-sync`: IndexedDB-based segment storage and session management
- `chrome-upload-service`: Service Worker upload logic - reads IndexedDB, calls Neo API, tracks progress

### Modified Capabilities

None.

## Impact

### Affected Components

| Component | Change |
|-----------|--------|
| `agent-steer/entrypoints/background.ts` | Add segment timer, storage polling |
| `agent-steer/entrypoints/content.ts` | rrweb event handling, segment flush |
| `agent-steer/src/recording/` | New modules: db/indexeddb.ts, cs/recorder.ts, sw/uploader.ts |
| `agent-steer/public/` | rrweb-bridge.js (injected script) |

### Dependencies

- Neo Backend Recording API (already implemented in `backend/src/app/api/v1/recording.py`)
- rrweb package (already installed)
- IndexedDB (browser native)

### Configuration

Extension config stored in chrome.storage:
```typescript
{
  neoUrl: "http://localhost:3000",
  backendUrl: "http://localhost:8002"
}
```

### User Flow

1. User opens popup → iframe bridge checks Neo login
2. User clicks "Start Recording" → Content Script starts rrweb
3. Every 10 minutes → segment flushes to IndexedDB
4. User clicks "Stop" → Recording stops
5. User clicks "Upload" → enters name → Service Worker uploads
6. Success → "View Playback" button appears
