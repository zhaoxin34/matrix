/**
 * Content script entry point.
 *
 * Manifest-registered content script. WXT injects this into every page
 * matching the `matches` pattern (we use `<all_urls>` because the user may
 * record any site).
 *
 * Mounts a single RecordingController per tab. Wires incoming popup
 * commands to controller handlers and forwards controller events to the
 * popup via `chrome.runtime.sendMessage`.
 */

import { installContentListener, registerCommandHandler } from '../src/messaging/content-handler'
import { type RecordingEvent } from '../src/messaging/protocol'
import { RecordingController } from '../src/recording/controller'

export default defineContentScript({
  // Run on every page; the user can record any site they choose.
  matches: ['<all_urls>'],
  // Don't run in iframes; recording happens at the top-level tab only.
  allFrames: false,
  // Inject as soon as possible so we don't miss early page events.
  runAt: 'document_start',

  main() {
    // In a Chrome content script there is no reliable tabId; we use 0 as a
    // placeholder identifier. The background script is the source of truth
    // for the real tab id and writes it to
    // chrome.storage.session.activeRecorderTabId.
    const PLACEHOLDER_TAB_ID = 0

    const controller = new RecordingController({
      tabId: PLACEHOLDER_TAB_ID,
      emit: (event: RecordingEvent) => {
        void chrome.runtime.sendMessage(event).catch(() => undefined)
      },
    })

    registerCommandHandler('recording.start', async () => {
      await controller.handleStart()
      return null
    })
    registerCommandHandler('recording.pause', async () => {
      await controller.handlePause()
      return null
    })
    registerCommandHandler('recording.resume', async () => {
      await controller.handleResume()
      return null
    })
    registerCommandHandler('recording.stop', async () => {
      await controller.handleStop()
      return null
    })
    registerCommandHandler('recording.fetch', async () => {
      await controller.handleFetch()
      return null
    })

    installContentListener()

    // Attempt to attach to an existing active session on startup.
    void controller.attachOnStartup()

    // Expose a handle for e2e tests to introspect.
    ;(
      globalThis as unknown as { __agentSteerController?: RecordingController }
    ).__agentSteerController = controller
  },
})
