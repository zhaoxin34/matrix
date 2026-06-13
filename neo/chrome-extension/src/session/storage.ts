/**
 * Thin wrapper around `chrome.storage.session` for the agent-steer
 * recording session. Holds the active session id and the tab id of the
 * currently-active recorder tab.
 *
 * `chrome.storage.session` is in-memory and scoped to the browser process,
 * so values do not persist across browser restarts (intentional).
 */

export interface ActiveSessionInfo {
  sessionId: string
  activeRecorderTabId: number | null
  startedAt: number
}

const KEY = 'agent_steer_active_session'

export async function getActiveSession(): Promise<ActiveSessionInfo | null> {
  const result = (await chrome.storage.session.get(KEY)) as Record<
    string,
    ActiveSessionInfo | undefined
  >
  return result[KEY] ?? null
}

export async function setActiveSession(info: ActiveSessionInfo): Promise<void> {
  await chrome.storage.session.set({ [KEY]: info })
}

export async function clearActiveSession(): Promise<void> {
  await chrome.storage.session.remove(KEY)
}

export async function setActiveRecorderTabId(tabId: number | null): Promise<void> {
  const current = await getActiveSession()
  if (!current) return
  await setActiveSession({ ...current, activeRecorderTabId: tabId })
}
