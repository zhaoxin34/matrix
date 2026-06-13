/**
 * Persists UserInfo to `chrome.storage.session`.
 * Browser-process-scoped: cleared when the browser restarts.
 */

import type { UserInfo } from './types'

export type { UserInfo }

const KEY = 'agent_steer_user_info'

export async function getUserInfo(): Promise<UserInfo | null> {
  const result = (await chrome.storage.session.get(KEY)) as Record<string, UserInfo | undefined>
  return result[KEY] ?? null
}

export async function setUserInfo(info: UserInfo): Promise<void> {
  await chrome.storage.session.set({ [KEY]: info })
}

export async function clearUserInfo(): Promise<void> {
  await chrome.storage.session.remove(KEY)
}
