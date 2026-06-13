/**
 * useAuthBridge — manages the popup's authentication state.
 *
 * On mount:
 *   1. Reads `userInfo` from `chrome.storage.session`.
 *   2. If absent, attempts to acquire it via the iframe bridge.
 *   3. Subscribes to the global `authRequired` bus event (fired on 401)
 *      and re-triggers the bridge.
 *
 * The component is expected to render the AuthRequired view whenever
 * `status !== 'ok'`, including while loading.
 */

import { useCallback, useEffect, useState } from 'react'

import { getConfig } from '../../../src/config/settings'
import { loadUserInfoFromIframe } from '../../../src/auth/iframe-bridge'
import { getUserInfo, setUserInfo, type UserInfo } from '../../../src/auth/user-info-store'
import { bus } from '../../../src/upload/api-client'
import type { AuthStatus } from '../../../src/auth/types'

export interface AuthBridgeState {
  /** Discriminated status. `'ok'` implies `userInfo` is non-null. */
  status: AuthStatus
  userInfo: UserInfo | null
  /** True during the initial load or a retry. */
  loading: boolean
  retry: () => void
}

export function useAuthBridge(): AuthBridgeState {
  const [status, setStatus] = useState<AuthStatus>('ok')
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  // Bumping this counter forces a re-fetch from the iframe.
  const [retryNonce, setRetryNonce] = useState(0)

  const retry = useCallback(() => setRetryNonce(n => n + 1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      // 1. Try session storage first.
      const existing = await getUserInfo()
      if (cancelled) return
      if (existing) {
        setUserInfoState(existing)
        setStatus('ok')
        setLoading(false)
        return
      }
      // 2. Fall back to iframe bridge.
      const configResult = await getConfig()
      if (cancelled) return
      if (!configResult.ok) {
        setStatus('not_authenticated')
        setLoading(false)
        return
      }
      const result = await loadUserInfoFromIframe(configResult.config)
      if (cancelled) return
      if (result.status === 'ok' && result.userInfo) {
        await setUserInfo(result.userInfo)
        setUserInfoState(result.userInfo)
        setStatus('ok')
      } else {
        setStatus(result.status)
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [retryNonce])

  // Listen for global authRequired (e.g. 401 from upload service).
  useEffect(() => {
    const off = bus.on('authRequired', () => {
      // Clear the local state and retry the bridge.
      setUserInfoState(null)
      setStatus('not_authenticated')
      retry()
    })
    return off
  }, [retry])

  return { status, userInfo, loading, retry }
}
