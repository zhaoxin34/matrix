/**
 * Background service worker.
 *
 * Coordinates cross-tab recording state via `chrome.storage.session`. Wires
 * `chrome.tabs.onActivated` and `chrome.tabs.onRemoved` to broadcast tab
 * switches to the content scripts involved.
 */

import { makeCommand } from '../src/messaging/protocol'
import { getActiveSession } from '../src/session/coordinator'

export default defineBackground(() => {
  chrome.tabs.onActivated.addListener(async activeInfo => {
    const session = await getActiveSession()
    if (!session) return
    if (session.activeRecorderTabId !== null && session.activeRecorderTabId !== activeInfo.tabId) {
      try {
        const flushMsg = makeCommand('recording.pause', {}) as unknown as {
          type: string
          messageId: string
        }
        await chrome.tabs.sendMessage(session.activeRecorderTabId, flushMsg)
      } catch {
        // Content script not present (e.g. chrome:// page) — ignore.
      }
    }
    try {
      const startMsg = makeCommand('recording.start', {
        sessionId: session.sessionId,
      }) as unknown as { type: string; messageId: string }
      await chrome.tabs.sendMessage(activeInfo.tabId, startMsg)
    } catch {
      // Same.
    }
  })

  chrome.tabs.onRemoved.addListener(async tabId => {
    const session = await getActiveSession()
    if (!session) return
    if (session.activeRecorderTabId === tabId) {
      await chrome.storage.session.set({
        agent_steer_active_session: { ...session, activeRecorderTabId: null },
      })
    }
  })
})
