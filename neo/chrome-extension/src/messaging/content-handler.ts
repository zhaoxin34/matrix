/**
 * Content-script side command router.
 *
 * Registers a `chrome.runtime.onMessage` listener that dispatches incoming
 * `recording.*` commands to registered handlers. The handler is expected to
 * emit a `recording.*` event back via `chrome.runtime.sendMessage` (carrying
 * the same messageId for correlation).
 */

import { assertValidMessage, isRecordingCommand, type RecordingCommand } from './protocol'

// Handler signature is intentionally loose (accepts the full union) — the
// command type was already validated by `assertValidMessage` and the handler
// can narrow internally. We avoid generic Extract gymnastics on the Map.
type AnyCommandHandler = (command: RecordingCommand) => Promise<unknown> | unknown

const handlers = new Map<RecordingCommand['type'], AnyCommandHandler>()

export function registerCommandHandler<T extends RecordingCommand['type']>(
  type: T,
  handler: (command: Extract<RecordingCommand, { type: T }>) => Promise<unknown> | unknown
): void {
  handlers.set(type, handler as unknown as AnyCommandHandler)
}

export function installContentListener(): void {
  chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
    let command: RecordingCommand
    try {
      assertValidMessage(raw)
      if (!isRecordingCommand(raw)) {
        sendResponse?.({ ok: false, error: 'not a command' })
        return false
      }
      command = raw
    } catch (err) {
      sendResponse?.({ ok: false, error: (err as Error).message })
      return false
    }

    const handler = handlers.get(command.type)
    if (!handler) {
      sendResponse?.({ ok: false, error: `no handler for ${command.type}` })
      return false
    }

    Promise.resolve()
      .then(() => handler(command))
      .then(payload => {
        sendResponse?.({ ok: true, payload })
      })
      .catch((err: Error) => {
        sendResponse?.({ ok: false, error: err.message })
      })
    return true // keep the message channel open for async sendResponse
  })
}

/** Test helper. */
export function _clearHandlersForTests(): void {
  handlers.clear()
}
