/**
 * ReplayerController — thin stateful wrapper around @rrweb/replay's
 * Replayer class.
 *
 * Goals:
 * - Expose a small, intent-named API (play / pause / seek / setSpeed / ...)
 *   so React UI does not need to know about the underlying Replayer
 *   internals (state machines, timers, config keys).
 * - Provide an event subscription surface (timeupdate, finish, skip) the UI
 *   can listen to without polling.
 * - Encapsulate lifecycle so a stale controller is fully disposable and
 *   never leaks DOM/event listeners.
 *
 * All times are in milliseconds in the API; callers can format to MM:SS
 * themselves.
 */
import { Replayer } from "@rrweb/replay";
// Pull in rrweb's stylesheet so `.replayer-mouse` and
// `.replayer-mouse-tail` are `position: absolute`. Without it they
// become ordinary block elements, the wrapper balloons to
// 20 + canvas_h + iframe_h, and the iframe is pushed off-screen.
import "@rrweb/replay/dist/style.css";
import type { eventWithTime, playerMetaData } from "@rrweb/types";

export type ControllerEvent =
  | "timeupdate"
  | "playing"
  | "pause"
  | "finish"
  | "skipstart"
  | "skipend"
  | "resize"
  | "destroy";

type EventMap = {
  [K in ControllerEvent]: Set<() => void>;
};

export interface ReplayerControllerOptions {
  container: HTMLElement;
  events: eventWithTime[];
  /** Default `1`; UI can also override via setSpeed. */
  speed?: 1 | 2 | 4 | 8;
  /** Default `false`; UI can toggle via setSkipInactive. */
  skipInactive?: boolean;
  /** Polling frequency for the timeupdate event. Default ~16ms (60fps). */
  timeupdateIntervalMs?: number;
}

export class ReplayerController {
  private readonly replayer: Replayer;
  private readonly opts: Required<
    Omit<ReplayerControllerOptions, "container" | "events">
  > & { container: HTMLElement; events: eventWithTime[] };
  private readonly listeners: EventMap = {
    timeupdate: new Set(),
    playing: new Set(),
    pause: new Set(),
    finish: new Set(),
    skipstart: new Set(),
    skipend: new Set(),
    resize: new Set(),
    destroy: new Set(),
  };
  private rafId: number | null = null;
  private lastEmittedTime = -1;
  private destroyed = false;
  private playingFlag = false;

  constructor(options: ReplayerControllerOptions) {
    this.opts = {
      container: options.container,
      events: options.events,
      speed: options.speed ?? 1,
      skipInactive: options.skipInactive ?? false,
      timeupdateIntervalMs: options.timeupdateIntervalMs ?? 16,
    };

    this.replayer = new Replayer(options.events, {
      root: options.container,
      // Mouse trail config: a fading line behind the cursor that
      // visualizes the user's path during the recording. The
      // official rrweb default is red, but we tint it to the
      // project's primary green so the trail fits the dark theme.
      mouseTail: {
        duration: 500,
        lineCap: "round",
        lineWidth: 3,
        strokeStyle: "#10b981", // emerald-500, matches `primary` in globals.css
      },
      speed: this.opts.speed,
      skipInactive: this.opts.skipInactive,
    });

    this.replayer.on("finish", () => {
      this.playingFlag = false;
      this.emit("finish");
    });
    this.replayer.on("pause", () => {
      this.playingFlag = false;
      this.emit("pause");
    });
    this.replayer.on("start", () => {
      this.playingFlag = true;
      this.emit("playing");
    });
    this.replayer.on("skip-start", () => this.emit("skipstart"));
    this.replayer.on("skip-end", () => this.emit("skipend"));
    this.replayer.on("resize", () => this.emit("resize"));
    this.replayer.on("destroy", () => this.emit("destroy"));

    this.startTimeLoop();
  }

  // ── transport control ─────────────────────────────────────────────

  play(): void {
    if (this.destroyed) return;
    this.replayer.play();
  }

  pause(): void {
    if (this.destroyed) return;
    this.replayer.pause();
  }

  /** Toggle play/pause. Returns the new playing state. */
  togglePlay(): boolean {
    if (this.destroyed) return false;
    if (this.isPlaying()) {
      this.pause();
      return false;
    }
    this.play();
    return true;
  }

  /**
   * Seek to a target offset in ms. Internally pauses-then-plays so the
   * machine flushes its buffered events and re-starts the timer.
   */
  seek(offsetMs: number): void {
    if (this.destroyed) return;
    const clamped = Math.max(0, Math.min(offsetMs, this.getTotalTime()));
    this.replayer.pause();
    this.replayer.play(clamped);
  }

  // ── time / meta ────────────────────────────────────────────────────

  getCurrentTime(): number {
    if (this.destroyed) return 0;
    return this.replayer.getCurrentTime();
  }

  getTotalTime(): number {
    if (this.destroyed) return 0;
    return this.replayer.getMetaData().totalTime;
  }

  getMetaData(): playerMetaData {
    return this.replayer.getMetaData();
  }

  /**
   * The recorded page's intrinsic dimensions (from the first Meta event).
   * Useful for sizing the player container to match the recording's
   * aspect ratio, or for scaling the rrweb wrapper to fit the viewport.
   * Returns `{ width: 0, height: 0 }` if the iframe is not yet ready.
   */
  getRecordingDimensions(): { width: number; height: number } {
    if (this.destroyed) return { width: 0, height: 0 };
    const iframe = (this.replayer as unknown as { iframe?: HTMLIFrameElement })
      .iframe;
    if (!iframe) return { width: 0, height: 0 };
    const w = Number.parseFloat(iframe.getAttribute("width") ?? "0");
    const h = Number.parseFloat(iframe.getAttribute("height") ?? "0");
    return { width: w, height: h };
  }

  /** True if the replayer state machine is currently "playing". */
  isPlaying(): boolean {
    return this.playingFlag;
  }

  // ── speed / skip / fullscreen ──────────────────────────────────────

  setSpeed(speed: 1 | 2 | 4 | 8): void {
    if (this.destroyed) return;
    this.opts.speed = speed;
    this.replayer.setConfig({ speed });
  }

  getSpeed(): 1 | 2 | 4 | 8 {
    return this.opts.speed;
  }

  setSkipInactive(enabled: boolean): void {
    if (this.destroyed) return;
    this.opts.skipInactive = enabled;
    this.replayer.setConfig({ skipInactive: enabled });
  }

  getSkipInactive(): boolean {
    return this.opts.skipInactive;
  }

  enterFullscreen(): Promise<void> {
    if (this.destroyed || typeof document === "undefined") {
      return Promise.resolve();
    }
    return this.opts.container.requestFullscreen?.() ?? Promise.resolve();
  }

  exitFullscreen(): Promise<void> {
    if (typeof document === "undefined") return Promise.resolve();
    return document.exitFullscreen?.() ?? Promise.resolve();
  }

  // ── events ─────────────────────────────────────────────────────────

  on(event: ControllerEvent, cb: () => void): () => void {
    this.listeners[event].add(cb);
    return () => this.off(event, cb);
  }

  off(event: ControllerEvent, cb: () => void): void {
    this.listeners[event].delete(cb);
  }

  private emit(event: ControllerEvent): void {
    for (const cb of this.listeners[event]) cb();
  }

  /**
   * Drive `timeupdate` from a rAF loop. The loop is the cheapest way to
   * keep the progress bar smooth without touching rrweb internals.
   * Replayer doesn't emit a per-frame time event, so we sample
   * getCurrentTime and only fire when it actually changes.
   */
  private startTimeLoop(): void {
    if (typeof window === "undefined") return;
    const tick = () => {
      if (this.destroyed) return;
      const t = this.getCurrentTime();
      if (t !== this.lastEmittedTime) {
        this.lastEmittedTime = t;
        this.emit("timeupdate");
      }
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  // ── lifecycle ──────────────────────────────────────────────────────

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    try {
      this.replayer.destroy();
    } catch {
      // rrweb may throw if already destroyed; ignore.
    }
    for (const k of Object.keys(this.listeners) as ControllerEvent[]) {
      this.listeners[k].clear();
    }
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }
}
