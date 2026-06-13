/**
 * Recording state machine — wires together rrweb, the segmenter, and the
 * session coordinator. Owns per-tab recording state.
 *
 * States: Idle → Recording → Paused → Recording → ... → Stopped
 *
 * Commands handled: start / pause / resume / stop / fetch.
 * Events emitted: state (on every transition), data (on fetch).
 */

import {
  ERROR_CODES,
  makeEvent,
  type RecordingEvent,
  type RecordingStateEvent,
  type RecordingDataEvent,
} from '../messaging/protocol'
import {
  becomeRecorder,
  demoteRecorder,
  endSession as endSessionInStorage,
  getActiveSession,
  tryAutoBecomeRecorder,
} from '../session/coordinator'
import {
  deleteSegmentsBySession,
  getSegmentsBySession,
  putSegment,
  type Segment,
} from '../storage/segments'
import { type eventWithTime } from 'rrweb'
import { RrwebRunner, createRrwebRunner } from './rrweb-runner'
import { Segmenter } from './segmenter'

export type ControllerState =
  | { kind: 'idle' }
  | {
      kind: 'recording'
      sessionId: string
      segmentCount: number
      eventCount: number
      duration: number
      startTime: number
    }
  | {
      kind: 'paused'
      sessionId: string
      segmentCount: number
      duration: number
      totalActiveMs: number
    }
  | { kind: 'stopped' }

export interface ControllerOptions {
  /** Tab id this controller is running in. */
  tabId: number
  /** Send an event to the popup. */
  emit: (event: RecordingEvent) => void
}

export class RecordingController {
  private tabId: number
  private emit: (e: RecordingEvent) => void
  private runner: RrwebRunner
  private segmenter: Segmenter | null = null
  private sessionId: string | null = null
  private state: ControllerState = { kind: 'idle' }
  /** When the current active recording interval started (excluding pauses). */
  private activeStartTime = 0
  /** Total active recording ms accumulated across pause/resume cycles. */
  private totalActiveMs = 0
  /** Listener installed on visibilitychange. */
  private onVisibilityChange?: () => void
  /** Listener installed on beforeunload. */
  private onBeforeUnload?: () => void
  /** Current recorded segmentCount (only increments on flush). */
  private segmentCount = 0

  constructor(options: ControllerOptions) {
    this.tabId = options.tabId
    this.emit = options.emit
    this.runner = createRrwebRunner({
      onEvent: evt => this.handleRrwebEvent(evt),
    })
    this.installLifecycleListeners()
  }

  /* ============================================================
   * Public command handlers
   * ============================================================ */

  async handleStart(): Promise<void> {
    if (this.state.kind === 'recording') {
      this.emitState({ error: ERROR_CODES.ALREADY_RECORDING })
      return
    }
    // Resume or new: an active session may already exist (we may be a
    // new tab attaching to an in-progress session). Otherwise start one.
    const existing = await getActiveSession()
    let sessionId: string
    if (existing) {
      sessionId = existing.sessionId
      // Make this tab the active recorder.
      await becomeRecorder(this.tabId)
    } else {
      const started = await this.createNewSession()
      sessionId = started
    }
    this.beginRecording(sessionId)
  }

  async handlePause(): Promise<void> {
    if (this.state.kind !== 'recording') {
      this.emitState({ error: ERROR_CODES.NOT_RECORDING })
      return
    }
    this.runner.stop()
    this.segmenter?.stopTimer()
    const flushed = await this.segmenter?.flush()
    if (flushed) this.segmentCount += 1
    // Add elapsed active time to total
    this.totalActiveMs += Date.now() - this.activeStartTime
    this.state = {
      kind: 'paused',
      sessionId: this.sessionId!,
      segmentCount: this.segmentCount,
      duration: 0,
      totalActiveMs: this.totalActiveMs,
    }
    this.emitState()
  }

  async handleResume(): Promise<void> {
    if (this.state.kind !== 'paused') {
      this.emitState({ error: ERROR_CODES.NOT_RECORDING })
      return
    }
    this.beginRecording(this.sessionId!, /*resume*/ true)
  }

  async handleStop(): Promise<void> {
    if (this.state.kind === 'idle' || this.state.kind === 'stopped') {
      this.emitState({ error: ERROR_CODES.NOT_RECORDING })
      return
    }
    this.runner.stop()
    this.segmenter?.stopTimer()
    if (this.segmenter?.hasEvents()) {
      const flushed = await this.segmenter.flush()
      if (flushed) this.segmentCount += 1
    }
    if (this.state.kind === 'recording') {
      this.totalActiveMs += Date.now() - this.activeStartTime
    }
    await endSessionInStorage()
    this.state = { kind: 'stopped' }
    this.sessionId = null
    this.segmenter = null
    this.emitState()
  }

  async handleFetch(): Promise<void> {
    if (!this.sessionId) {
      this.emit(makeEvent('recording.data', { segments: [] }))
      return
    }
    const segs = await getSegmentsBySession(this.sessionId)
    const event = makeEvent('recording.data', {
      segments: segs.map(s => ({
        uid: s.uid,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.endTime - s.startTime,
        eventCount: s.events.length,
        pageUrls: s.pageUrls,
      })),
    }) satisfies RecordingDataEvent
    this.emit(event)
  }

  /* ============================================================
   * Lifecycle
   * ============================================================ */

  /** Called on content script startup to attempt to attach to an active session. */
  async attachOnStartup(): Promise<void> {
    const existing = await getActiveSession()
    if (!existing) {
      this.emitState()
      return
    }
    this.sessionId = existing.sessionId
    if (existing.activeRecorderTabId === null) {
      // Previous recorder tab was closed; this tab takes over.
      const promoted = await tryAutoBecomeRecorder(this.tabId)
      if (promoted) {
        this.beginRecording(existing.sessionId, /*resume*/ true)
        return
      }
    } else if (existing.activeRecorderTabId === this.tabId) {
      this.beginRecording(existing.sessionId, /*resume*/ true)
      return
    }
    // Otherwise, another tab is the recorder; we stay idle but know the session.
    this.state = { kind: 'idle' }
    this.emitState()
  }

  /** Called when the tab is being hidden (visibilitychange → hidden). */
  async onTabHidden(): Promise<void> {
    if (this.state.kind !== 'recording') return
    this.runner.stop()
    this.segmenter?.stopTimer()
    if (this.segmenter?.hasEvents()) {
      const flushed = await this.segmenter.flushForTabSwitch()
      if (flushed) this.segmentCount += 1
    }
    this.totalActiveMs += Date.now() - this.activeStartTime
    await demoteRecorder(this.tabId)
    this.state = {
      kind: 'paused',
      sessionId: this.sessionId!,
      segmentCount: this.segmentCount,
      duration: 0,
      totalActiveMs: this.totalActiveMs,
    }
    this.emitState()
  }

  /** Called when the tab becomes visible again. */
  async onTabVisible(): Promise<void> {
    if (this.state.kind !== 'paused' || !this.sessionId) return
    const existing = await getActiveSession()
    if (!existing) {
      this.state = { kind: 'idle' }
      this.emitState()
      return
    }
    // If no recorder is set, take over.
    if (existing.activeRecorderTabId === null) {
      await becomeRecorder(this.tabId)
      this.beginRecording(this.sessionId, /*resume*/ true)
    } else if (existing.activeRecorderTabId === this.tabId) {
      this.beginRecording(this.sessionId, /*resume*/ true)
    } else {
      // Another tab took over; we remain paused.
      this.emitState()
    }
  }

  /** Destroy the controller (e.g. on extension reload). */
  async destroy(): Promise<void> {
    this.runner.stop()
    this.segmenter?.stopTimer()
    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange)
    }
    if (this.onBeforeUnload) {
      window.removeEventListener('beforeunload', this.onBeforeUnload)
    }
  }

  /** Currently loaded session id (for testing). */
  getSessionId(): string | null {
    return this.sessionId
  }

  /** Current controller state (for testing). */
  getState(): ControllerState {
    return this.state
  }

  /* ============================================================
   * Internals
   * ============================================================ */

  private async createNewSession(): Promise<string> {
    const started = await (await import('../session/coordinator')).startNewSession()
    await becomeRecorder(this.tabId)
    return started.sessionId
  }

  private beginRecording(sessionId: string, resume = false): void {
    this.sessionId = sessionId
    const seq = resume ? this.segmentCount + 1 : 1
    this.segmenter = new Segmenter({
      sessionId,
      startSequence: seq,
      onSegmentFlushed: seg => {
        this.segmentCount = Math.max(this.segmentCount, seg.sequence)
        this.emitState()
      },
    })
    this.activeStartTime = Date.now()
    if (!resume) {
      this.totalActiveMs = 0
      this.segmentCount = 0
    }
    this.runner.start()
    this.segmenter.startTimer()
    this.state = {
      kind: 'recording',
      sessionId,
      segmentCount: this.segmentCount,
      eventCount: 0,
      duration: this.totalActiveMs,
      startTime: this.activeStartTime,
    }
    this.emitState()
  }

  private handleRrwebEvent(evt: eventWithTime): void {
    if (this.state.kind !== 'recording') return
    try {
      this.segmenter?.pushEvent(evt)
    } catch (err) {
      this.emitState({ error: ERROR_CODES.STORAGE_FULL })
      this.runner.stop()
      return
    }
    if (this.state.kind === 'recording') {
      const ev = this.segmenter!.currentEventCount()
      this.state = { ...this.state, eventCount: ev }
    }
  }

  private emitState(overrides: { error?: string } = {}): void {
    const isActiveRecorder = this.state.kind === 'recording'
    const sessionId = this.sessionId ?? ''
    const duration = this.computeDuration()
    const segmentCount = this.segmentCount
    const eventCount = this.segmenter?.currentEventCount() ?? 0
    const isRecording = this.state.kind === 'recording'
    const isPaused = this.state.kind === 'paused'
    const payload: RecordingStateEvent['payload'] = {
      isRecording,
      isPaused,
      duration,
      segmentCount,
      eventCount,
      sessionId,
      isActiveRecorder,
      ...(overrides.error ? { error: overrides.error } : {}),
    }
    this.emit(makeEvent('recording.state', payload))
  }

  private computeDuration(): number {
    if (this.state.kind === 'recording') {
      return this.totalActiveMs + (Date.now() - this.activeStartTime)
    }
    if (this.state.kind === 'paused') {
      return this.totalActiveMs
    }
    return 0
  }

  private installLifecycleListeners(): void {
    this.onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void this.onTabHidden()
      } else if (document.visibilityState === 'visible') {
        void this.onTabVisible()
      }
    }
    document.addEventListener('visibilitychange', this.onVisibilityChange)

    this.onBeforeUnload = () => {
      // Best-effort: synchronously request a flush. We can't await here, so
      // we kick the promise and rely on putSegment's idb transaction to
      // commit before the page unloads.
      if (this.state.kind === 'recording' && this.segmenter?.hasEvents()) {
        void this.segmenter.flush().catch(() => undefined)
      }
    }
    window.addEventListener('beforeunload', this.onBeforeUnload)
  }
}

/** Delete all segments for a session — used by upload service or explicit discard. */
export async function discardSession(sessionId: string): Promise<void> {
  await deleteSegmentsBySession(sessionId)
}

/** Re-export for convenience. */
export { putSegment }
