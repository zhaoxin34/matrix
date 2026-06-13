/**
 * Popup-side messaging client.
 *
 * Sends `recording.*` commands to the content script of a given tab and
 * resolves with the matching `recording.*` event response (correlated by
 * messageId).
 */

import {
  makeCommand,
  PROTOCOL_VERSION,
  type RecordingCommand,
  type RecordingEvent,
} from './protocol'

interface PendingResolver {
  resolve: (event: RecordingEvent) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const DEFAULT_TIMEOUT_MS = 10_000
const pending = new Map<string, PendingResolver>()

/** Install a listener for events arriving from the content script. */
export function installPopupListener(): void {
  chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
    if (typeof raw !== 'object' || raw === null || (raw as { type?: unknown }).type === undefined) {
      return false
    }
    const msg = raw as { type: string; messageId?: string; direction?: string; version?: number }
    if (msg.direction !== 'event' || msg.version !== PROTOCOL_VERSION) {
      return false
    }
    const resolver = msg.messageId ? pending.get(msg.messageId) : undefined
    if (resolver) {
      pending.delete(msg.messageId!)
      clearTimeout(resolver.timer)
      resolver.resolve(raw as RecordingEvent)
      sendResponse?.({ ok: true })
      return true
    }
    // Uncorrelated event (e.g. state pushed without a fetch request):
    // deliver via a separate channel; for now, ignore at this layer.
    return false
  })
}

/**
 * Send a command to the content script in the given tab and resolve with
 * the matching event response.
 */
export async function sendCommand(
  tabId: number,
  command: RecordingCommand,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<RecordingEvent> {
  if (tabId == null) {
    throw new Error('sendCommand: tabId is required')
  }
  return new Promise<RecordingEvent>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(command.messageId)
      reject(new Error(`Command '${command.type}' timed out after ${timeoutMs}ms`))
    }, timeoutMs)
    pending.set(command.messageId, { resolve, reject, timer })
    chrome.tabs.sendMessage(tabId, command).catch(err => {
      pending.delete(command.messageId)
      clearTimeout(timer)
      reject(err)
    })
  })
}

/** Convenience: build + send a command. Overloads preserve payload typing. */
export async function sendRecordingCommand(
  tabId: number,
  type: 'recording.start',
  payload: { sessionId: string },
  timeoutMs?: number
): Promise<RecordingEvent>
export async function sendRecordingCommand(
  tabId: number,
  type: 'recording.pause' | 'recording.resume' | 'recording.stop' | 'recording.fetch',
  payload?: Record<string, never>,
  timeoutMs?: number
): Promise<RecordingEvent>
export async function sendRecordingCommand(
  tabId: number,
  type: RecordingCommand['type'],
  payload: unknown,
  timeoutMs?: number
): Promise<RecordingEvent> {
  // Runtime guarantee: the caller picked a (type, payload) pair that matches.
  // The overloads above preserve compile-time type safety; the cast below
  // bridges the union-vs-specific mismatch inside makeCommand's signature.
  const cmd = (makeCommand as (t: RecordingCommand['type'], p: unknown) => RecordingCommand)(
    type,
    payload
  )
  return sendCommand(tabId, cmd, timeoutMs)
}

/** Test helper: clear all pending resolvers. */
export function _clearPendingForTests(): void {
  for (const r of pending.values()) {
    clearTimeout(r.timer)
    r.reject(new Error('cleared by test'))
  }
  pending.clear()
}
