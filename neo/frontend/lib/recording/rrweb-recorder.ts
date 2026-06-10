/**
 * Thin wrapper around `@rrweb/record` that:
 * - Buffers events emitted by rrweb for the current segment
 * - Tracks the unique page URLs visited during the segment
 * - Exposes consumeEvents() so the caller can flush the buffer to S3
 *
 * This is intentionally imperative (a class, not a Hook) so it can be
 * unit-tested in isolation and embedded in any container component.
 */

import { record } from "@rrweb/record";
import type { eventWithTime } from "@rrweb/types";

/** Per design.md §3.1 / spec 4.2: a new segment is cut every 10 minutes. */
export const SEGMENT_DURATION_MS = 10 * 60 * 1000;

type StopHandler = () => void;

export class RrwebRecorder {
  private buffer: eventWithTime[] = [];
  private pageUrls = new Set<string>();
  private stopHandler: StopHandler | null = null;
  private active = false;

  /**
   * Start recording. Idempotent — calling start() while already recording
   * is a no-op.
   */
  start(): void {
    if (this.active) return;
    if (typeof window === "undefined") {
      throw new Error("RrwebRecorder.start() called outside the browser");
    }

    // Seed the current URL so the first segment has at least one page.
    this.pageUrls.add(window.location.href);

    const stop = record({
      emit: (event: eventWithTime) => {
        this.buffer.push(event);
        this.collectPageUrl(event);
      },
      // rrweb will insert a checkpoint event at this interval; helpful for
      // replay alignment even though we manage segment cutting ourselves.
      checkoutEveryNms: SEGMENT_DURATION_MS,
    });

    if (!stop) {
      throw new Error("rrweb.record() returned no handler");
    }
    this.stopHandler = stop;
    this.active = true;
  }

  /**
   * Stop recording and release the rrweb listener. Any events still in
   * the buffer are discarded — the caller is expected to flush first.
   */
  stop(): void {
    if (!this.active) return;
    this.stopHandler?.();
    this.stopHandler = null;
    this.active = false;
  }

  isRecording(): boolean {
    return this.active;
  }

  /**
   * Return the current buffer and reset it. Page URLs are returned as a
   * snapshot and the set is cleared so the next segment starts fresh.
   */
  consumeEvents(): { events: eventWithTime[]; pageUrls: string[] } {
    const events = this.buffer;
    const pageUrls = Array.from(this.pageUrls);
    this.buffer = [];
    this.pageUrls.clear();
    // Re-seed the current URL so the next segment has at least one entry.
    if (typeof window !== "undefined") {
      this.pageUrls.add(window.location.href);
    }
    return { events, pageUrls };
  }

  /**
   * Force a full snapshot on the next emit. Useful after navigation events
   * that rrweb might not pick up otherwise.
   */
  takeFullSnapshot(): void {
    if (this.active) {
      record.takeFullSnapshot(true);
    }
  }

  private collectPageUrl(event: eventWithTime): void {
    // rrweb wraps the underlying window object on every event; pull href
    // from the most common locations.
    const href = extractHref(event);
    if (href) this.pageUrls.add(href);
  }
}

function extractHref(event: eventWithTime): string | null {
  // Most event payloads carry a `data` field. For Meta events (type 4)
  // and other DOM-bearing events, href is nested under data.href.
  const data = (event as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  if (typeof obj.href === "string") return obj.href;

  // Some events nest a `location` object (e.g. page navigations).
  const loc = obj.location as Record<string, unknown> | undefined;
  if (loc && typeof loc.href === "string") return loc.href;

  return null;
}
