/**
 * Segmenter — accumulates rrweb events for the current segment, tracks
 * visited URLs, and flushes a finished segment to IndexedDB on trigger.
 *
 * Flush triggers:
 *   - 10-minute auto timer
 *   - explicit `flushForTabSwitch()` (no timer reset; caller decides)
 *   - explicit `flush()` (used by pause/stop)
 *   - beforeunload (synchronous last-chance flush)
 */

import { type eventWithTime } from 'rrweb'
import { putSegment, type Segment } from '../storage/segments'

export interface SegmenterOptions {
  sessionId: string
  /** Initial sequence number (1 for the first segment of a session). */
  startSequence: number
  /** ms, default 10 minutes */
  autoFlushMs?: number
  /** Called after each successful flush with the new sequence number. */
  onSegmentFlushed?: (segment: Segment) => void
  /** Called when auto-flush timer fires. */
  onAutoFlush?: () => void
}

interface ActiveSegment {
  sequence: number
  startTime: number
  endTime: number
  events: eventWithTime[]
  pageUrls: Set<string>
}

const DEFAULT_AUTO_FLUSH_MS = 10 * 60 * 1000

export class Segmenter {
  private current: ActiveSegment
  private timer: ReturnType<typeof setTimeout> | null = null
  private nextSequence: number
  private readonly autoFlushMs: number
  private readonly sessionId: string
  private readonly onSegmentFlushed?: (s: Segment) => void
  private readonly onAutoFlush?: () => void

  constructor(options: SegmenterOptions) {
    this.sessionId = options.sessionId
    this.nextSequence = options.startSequence
    this.autoFlushMs = options.autoFlushMs ?? DEFAULT_AUTO_FLUSH_MS
    this.onSegmentFlushed = options.onSegmentFlushed
    this.onAutoFlush = options.onAutoFlush
    this.current = {
      sequence: this.nextSequence,
      startTime: Date.now(),
      endTime: 0,
      events: [],
      pageUrls: new Set(),
    }
  }

  /** Start the 10-minute auto-flush timer. */
  startTimer(): void {
    this.stopTimer()
    this.timer = setTimeout(() => {
      this.onAutoFlush?.()
      void this.flush()
      // schedule the next
      this.startTimer()
    }, this.autoFlushMs)
  }

  /** Stop the 10-minute auto-flush timer (does not flush). */
  stopTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /** Append a captured event to the current segment. */
  pushEvent(evt: eventWithTime): void {
    this.current.events.push(evt)
    if (evt.type === 4 /* Meta */) {
      const url = (evt.data as { href?: string }).href
      if (typeof url === 'string') this.current.pageUrls.add(url)
    }
  }

  /** Whether the current segment has at least one event. */
  hasEvents(): boolean {
    return this.current.events.length > 0
  }

  /**
   * Flush the current segment. Resets internal state and starts a new
   * segment with sequence+1. If the segment is empty, it is a no-op.
   */
  async flush(): Promise<Segment | null> {
    if (this.current.events.length === 0) {
      // Nothing to flush; just reset start time so the new segment begins now.
      this.current.startTime = Date.now()
      return null
    }
    this.current.endTime = Date.now()
    const seg: Segment = {
      uid: crypto.randomUUID(),
      sessionId: this.sessionId,
      sequence: this.current.sequence,
      startTime: this.current.startTime,
      endTime: this.current.endTime,
      events: [...this.current.events],
      pageUrls: [...this.current.pageUrls],
      synced: 0,
      createdAt: Date.now(),
    }
    try {
      await putSegment(seg)
    } catch (err) {
      // Re-throw so the controller can surface the error to the popup,
      // but DO NOT advance the segment — caller may retry.
      throw err
    }
    this.onSegmentFlushed?.(seg)
    this.nextSequence = seg.sequence + 1
    this.current = {
      sequence: this.nextSequence,
      startTime: Date.now(),
      endTime: 0,
      events: [],
      pageUrls: new Set(),
    }
    return seg
  }

  /**
   * Flush current segment without resetting the timer. Intended for tab
   * switches: the leaving tab finalizes its segment, the new tab starts a
   * new one (handled by the controller calling `startTimer` on the new tab).
   */
  async flushForTabSwitch(): Promise<Segment | null> {
    return this.flush()
  }

  /** Get current sequence number (for state reporting). */
  currentSequence(): number {
    return this.current.sequence
  }

  /** Get current event count (for state reporting). */
  currentEventCount(): number {
    return this.current.events.length
  }
}
