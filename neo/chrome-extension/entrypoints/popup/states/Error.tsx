/**
 * Error — shown when the upload (or another action) failed. Provides
 * a retry button and a cancel button.
 */

interface Props {
  error: string
  onRetry: () => void | Promise<void>
  onCancel: () => void
}

export function Error({ error, onRetry, onCancel }: Props) {
  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p className="status-error">❌ 出错了</p>
      <div className="error-box">{error}</div>
      <div className="btn-row popup-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="btn-primary" onClick={() => void onRetry()}>
          重试
        </button>
      </div>
    </div>
  )
}
