/**
 * Thin wrapper around rrweb's `record()` API.
 *
 * The runner owns the rrweb instance lifecycle for a single content script.
 * Call `start()` to begin capturing and `stop()` to halt. Events are
 * delivered via the `onEvent` callback.
 */

import { record, type eventWithTime } from 'rrweb'

type StopFn = () => void

export interface RrwebRunner {
  start(): void
  stop(): void
  isRunning(): boolean
}

export interface RrwebRunnerOptions {
  onEvent: (evt: eventWithTime) => void
}

export function createRrwebRunner(options: RrwebRunnerOptions): RrwebRunner {
  let stopFn: StopFn | null = null

  return {
    start() {
      if (stopFn) return // already running
      const emits: StopFn = record({
        emit: evt => options.onEvent(evt),
        // Defaults from rrweb are sensible; we can expose them as options
        // later if needed (sampling, maskAllInputs, etc.).
      }) as unknown as StopFn
      stopFn = emits
    },
    stop() {
      if (stopFn) {
        stopFn()
        stopFn = null
      }
    },
    isRunning() {
      return stopFn !== null
    },
  }
}
