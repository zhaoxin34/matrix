/**
 * AuthRequired — shown when the popup can't authenticate.
 *
 * Variants (from auth status):
 *   - not_authenticated: "请先登录 Neo"
 *   - no_workspace:      "请先选择工作区"
 *   - timeout:           "无法连接到 Neo，请检查网络"
 *
 * Always renders an invisible iframe so the postMessage bridge can
 * deliver the user info payload even before the user has logged in.
 */

import { useEffect, useState } from 'react'

import type { AuthStatus } from '../../../src/auth/types'
import { getConfig } from '../../../src/config/settings'

interface Props {
  status: AuthStatus
  onRetry: () => void
  getFrontendUrl: () => Promise<string>
}

const MESSAGES: Record<AuthStatus, string> = {
  not_authenticated: '请先登录 Neo',
  no_workspace: '请先在 Neo 中选择工作区',
  timeout: '无法连接到 Neo，请检查网络',
  ok: '',
}

export function AuthRequired({ status, onRetry, getFrontendUrl }: Props) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const r = await getConfig()
      if (cancelled) return
      if (r.ok) {
        setIframeSrc(
          `${r.config.frontend_base_url}${r.config.user_info_path}?v=1&source=agent_steer`
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [onRetry])

  const message = MESSAGES[status] || MESSAGES.not_authenticated
  const isTimeout = status === 'timeout'

  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p className="status-warning-strong">⚠️ {message}</p>
      <p className="muted popup-footer">打开 Neo 并完成操作后重新打开此弹窗</p>
      <div className="btn-row">
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => {
            const url = await getFrontendUrl()
            if (url) chrome.tabs.create({ url })
          }}
        >
          打开 Neo
        </button>
        <button
          type="button"
          className={isTimeout ? 'btn-warning' : 'btn-primary'}
          onClick={onRetry}
        >
          重试
        </button>
      </div>
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="agent-steer-user-info"
          aria-hidden="true"
          className="bridge"
        />
      )}
    </div>
  )
}
