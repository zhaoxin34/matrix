/**
 * Loads the frontend `/agent-steer/user-info` page in a hidden iframe and
 * resolves with the user info it posts back. Strictly validates message
 * origin against the configured frontend URL.
 *
 * See design.md §7.5.
 */

import type { AgentSteerConfig } from '../config/types'
import type { AuthStatus, UserInfo } from './types'

export interface BridgeResult {
  status: AuthStatus
  userInfo?: UserInfo
}

const PROTOCOL_VERSION = 1
const IFRAME_TIMEOUT_MS = 5_000

/**
 * Inject a hidden iframe into the document and wait for the
 * `agent_steer_user_info` postMessage from it.
 *
 * Caller is responsible for removing the iframe after this resolves/rejects.
 */
export function loadUserInfoFromIframe(
  config: AgentSteerConfig,
  parentWindow: Window = window,
  parentDocument: Document = document
): Promise<BridgeResult> {
  return new Promise<BridgeResult>(resolve => {
    const iframe = parentDocument.createElement('iframe')
    iframe.src = `${config.frontend_base_url}${config.user_info_path}?v=${PROTOCOL_VERSION}&source=agent_steer`
    iframe.style.display = 'none'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.setAttribute('data-agent-steer-bridge', 'true')

    const timer = setTimeout(() => {
      cleanup()
      resolve({ status: 'timeout' })
    }, IFRAME_TIMEOUT_MS)

    function onMessage(event: MessageEvent): void {
      // STRICT origin check — see design.md §7.5.2. Must be exact equality.
      if (event.origin !== config.frontend_base_url) return
      const data = event.data as
        | { type?: string; version?: number; status?: AuthStatus }
        | undefined
      if (!data || data.type !== 'agent_steer_user_info' || data.version !== PROTOCOL_VERSION) {
        return
      }
      cleanup()
      if (data.status === 'ok') {
        const info = event.data as unknown as UserInfo & { status: AuthStatus }
        resolve({ status: 'ok', userInfo: info })
      } else {
        resolve({ status: (data.status as AuthStatus) ?? 'not_authenticated' })
      }
    }

    function cleanup(): void {
      clearTimeout(timer)
      parentWindow.removeEventListener('message', onMessage)
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }

    parentWindow.addEventListener('message', onMessage)
    parentDocument.body.appendChild(iframe)
  })
}
