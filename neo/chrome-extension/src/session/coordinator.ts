/**
 * Cross-tab session coordinator.
 *
 * Coordinates the active session id and the active recorder tab id across
 * multiple browser tabs. All state lives in `chrome.storage.session`; this
 * module is just typed access + a small event-emitter for change
 * notifications.
 */

import {
  clearActiveSession,
  getActiveSession,
  setActiveRecorderTabId,
  setActiveSession,
  type ActiveSessionInfo,
} from './storage'

// Re-export for convenience — controller.ts and other modules can import
// everything they need from the coordinator barrel.
export { getActiveSession }

export type CoordinatorListener = (info: ActiveSessionInfo | null) => void

const listeners = new Set<CoordinatorListener>()

/** Subscribe to active-session changes. */
export function onChange(listener: CoordinatorListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(info: ActiveSessionInfo | null): void {
  for (const l of listeners) {
    try {
      l(info)
    } catch (err) {
      console.error('[agent-steer] coordinator listener error', err)
    }
  }
}

/** Initialize a new active session in this tab. */
export async function startNewSession(): Promise<ActiveSessionInfo> {
  const info: ActiveSessionInfo = {
    sessionId: crypto.randomUUID(),
    activeRecorderTabId: null,
    startedAt: Date.now(),
  }
  await setActiveSession(info)
  emit(info)
  return info
}

/** Attach the current tab as the active recorder for an existing session. */
export async function becomeRecorder(tabId: number): Promise<ActiveSessionInfo> {
  const current = await getActiveSession()
  if (!current) {
    throw new Error('becomeRecorder called with no active session')
  }
  const updated: ActiveSessionInfo = { ...current, activeRecorderTabId: tabId }
  await setActiveSession(updated)
  emit(updated)
  return updated
}

/** Demote the current tab from active recorder (tab is hiding or going away). */
export async function demoteRecorder(tabId: number): Promise<ActiveSessionInfo | null> {
  const current = await getActiveSession()
  if (!current || current.activeRecorderTabId !== tabId) {
    return current
  }
  const updated: ActiveSessionInfo = { ...current, activeRecorderTabId: null }
  await setActiveSession(updated)
  emit(updated)
  return updated
}

/** End the active session entirely. */
export async function endSession(): Promise<void> {
  await clearActiveSession()
  emit(null)
}

/** Promote the current tab to active recorder if no recorder is set. */
export async function tryAutoBecomeRecorder(tabId: number): Promise<boolean> {
  const current = await getActiveSession()
  if (!current) return false
  if (current.activeRecorderTabId !== null) return false
  await becomeRecorder(tabId)
  return true
}

/** Test helper. */
export function _clearListenersForTests(): void {
  listeners.clear()
}
