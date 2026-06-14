# Design: Agent Steer Recording Upload

## Context

The Agent Steer Chrome extension needs actual recording and upload functionality. The popup UI with authentication is complete, but the recording engine (rrweb), local storage (IndexedDB), and upload pipeline (Service Worker → Neo API) are not yet implemented.

### Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Popup UI | ✅ Complete | React components with authentication |
| iframe-bridge | ✅ Complete | Gets Neo login state |
| background.ts | ⚠️ Stub | Only logs rrweb events |
| content.ts | ⚠️ Stub | Only forwards postMessage |
| rrweb-bridge.js | ❌ Missing | Injected script for page main world |
| IndexedDB storage | ❌ Missing | No local segment storage |
| Upload logic | ❌ Missing | No Neo API integration |

### Constraints

1. **rrweb must run in page main world** - Chrome CSP blocks content script access to page variables
2. **Content Script can't directly call Neo API** - CORS restrictions
3. **Service Worker is the upload agent** - Has access to both IndexedDB and network
4. **Storage sync via chrome.storage** - Content Script polls for commands

## Goals / Non-Goals

**Goals:**
- Implement rrweb recording with 10-minute segment auto-flush
- Store segments in IndexedDB for browser restart resilience
- Upload segments to Neo Backend via Service Worker
- Use chrome.storage as command/response sync channel

**Non-Goals:**
- Video recording (only rrweb DOM events)
- Server-side playback (handled by Neo Frontend)
- Multi-tab coordination beyond session tracking
- Compression/optimization of rrweb events

## Decisions

### Decision 1: Segment Timer Runs in rrweb-bridge.js (Page Main World)

**Choice:** The 10-minute segment flush timer runs inside `rrweb-bridge.js` in the page main world.

**Rationale:** The timer needs to survive Service Worker sleep cycles. By placing it in the injected script, it runs alongside rrweb in the same context.

**Alternatives considered:**
- Service Worker setInterval: ❌ SW can sleep, timer won't fire
- Content Script setInterval: ⚠️ Works but adds complexity
- Background script: ❌ Not reliable for timing

### Decision 2: IndexedDB via Content Script, Accessed by Service Worker

**Choice:** Content Script creates/manages IndexedDB. Service Worker reads from same DB via `browser.tabs.executeScript`.

**Rationale:** IndexedDB is per-origin, so Content Script and Service Worker share the same database.

**Alternatives considered:**
- Service Worker direct IndexedDB access: ❌ Not directly possible
- chrome.storage for segment data: ❌ 10MB quota too small for recordings
- Content Script owns all storage: ✅ Works, but SW needs fetch to read

**Implementation:** Service Worker uses `browser.tabs.sendMessage` to ask Content Script to read/write IndexedDB, or injects a helper script.

### Decision 3: Command/Response via chrome.storage (Not runtime messages)

**Choice:** Popup writes commands to `chrome.storage.local`. Content Script polls and writes state back. Same for Service Worker.

**Rationale:**
- Content Script ↔ Service Worker direct messaging is complex (different contexts)
- `storage.onChanged` events are reliable for cross-component sync
- Works even when components aren't simultaneously active

**Flow:**
```
Popup → chrome.storage.local (command) → Content Script (polls)
Content Script → chrome.storage.local (state) → Popup (observes)
Service Worker → chrome.storage.local (upload progress) → Popup (observes)
```

### Decision 4: Upload Uses Neo Backend API (Not S3 Direct)

**Choice:** Segments are uploaded through `PUT /workspaces/{code}/recordings/{uid}/segments/{seg_uid}/bytes`.

**Rationale:** The backend endpoint handles CORS (rustfs doesn't have bucket CORS configured). The backend proxies to S3.

**Alternatives considered:**
- Presigned S3 URL direct upload: ❌ CORS blocked
- WebSocket streaming: ❌ Overkill for this use case

### Decision 5: Single Session ID for Browser Session

**Choice:** Session ID is generated once on "Start Recording" and persists until browser closes.

**Rationale:** Matches user mental model of "one recording session". Multiple segments within one session.

**Alternatives considered:**
- New session per tab: ❌ Confusing UX
- User-defined sessions: ❌ Too complex

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Page (Main World)                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    rrweb-bridge.js                           │   │
│  │                                                              │   │
│  │  rrweb.record({ emit: (event) => { ... } })                │   │
│  │                                                              │   │
│  │  setInterval(flushSegment, 10min)                           │   │
│  │         │                                                     │   │
│  │         ▼                                                     │   │
│  │  events[] ──→ indexedDB.segments.put(segment)                 │   │
│  │                                                              │   │
│  │  window.postMessage({ type: "segment-flushed" })            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Content Script                            │   │
│  │  - Forwards postMessage → background                         │   │
│  │  - Polls chrome.storage for commands                         │   │
│  │  - Manages IndexedDB (via injected helper)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Service Worker                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Receives segment notifications                           │   │
│  │  - Reads segments from IndexedDB (via tab injection)        │   │
│  │  - Uploads to Neo API:                                      │   │
│  │    1. POST /workspaces/{code}/recordings (create)          │   │
│  │    2. PUT /.../segments/{uid}/bytes (upload data)         │   │
│  │    3. POST /.../complete (finalize)                        │   │
│  │  - Updates chrome.storage with progress                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## File Structure

```
agent-steer/
├── entrypoints/
│   ├── background.ts        # Service Worker - upload + segment timer coordination
│   └── content.ts          # Content Script - rrweb event forwarding + IndexedDB ops
│
├── src/recording/
│   ├── index.ts            # Main exports
│   ├── types.ts           # RecordingState, Segment, UploadProgress
│   ├── storage.ts         # chrome.storage.local wrapper
│   │
│   ├── db/
│   │   └── indexeddb.ts   # IndexedDB operations for segments
│   │
│   ├── cs/
│   │   ├── recorder.ts     # rrweb integration logic
│   │   └── segment.ts     # Segment management
│   │
│   ├── sw/
│   │   └── uploader.ts    # Neo API upload logic
│   │
│   └── ui/                # Existing popup UI components
│
└── public/
    └── rrweb-bridge.js    # Injected into page main world (Vite copies to public)
```

## API Integration

### Neo Backend Endpoints

| Step | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| 1 | POST | `/api/v1/workspaces/{code}/recordings` | Create recording |
| 2 | PUT | `/api/v1/workspaces/{code}/recordings/{uid}/segments/{seg_uid}/bytes` | Upload segment data |
| 3 | POST | `/api/v1/workspaces/{code}/recordings/{uid}/complete` | Mark recording done |

### chrome.storage Keys

| Key | Type | Direction | Purpose |
|-----|------|-----------|---------|
| `recording.cmd` | `{ action: string }` | Popup → CS | Start/pause/resume/stop |
| `recording.state` | `RecordingState` | CS → Popup | Current recording status |
| `upload.cmd` | `{ name: string }` | Popup → SW | Trigger upload |
| `upload.progress` | `UploadProgress` | SW → Popup | Upload progress |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB quota exceeded | Recording stops | Implement auto-cleanup of old synced segments |
| Service Worker sleep during upload | Upload interrupted | Track upload state, resume on wake |
| Tab closed during recording | Segment data loss | Flush segments periodically, not just on stop |
| Neo API downtime | Upload fails | Retry with exponential backoff, notify user |

## Open Questions

1. **Segment merge on upload:** Do we upload each segment separately or merge into one file?
   - Current thinking: Upload separately (matches API design)

2. **Replay URL:** What URL does "View Playback" link to?
   - Need to check Neo Frontend for recording playback route

3. **Storage cleanup policy:** When do we delete old synced segments?
   - Suggestion: Keep last 10 sessions or 7 days, whichever is smaller
