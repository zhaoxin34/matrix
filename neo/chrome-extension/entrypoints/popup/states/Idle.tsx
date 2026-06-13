/**
 * Idle — shown when the user is authenticated and not currently recording.
 * The only action is to start a new recording.
 */

interface Props {
  onStart: () => void | Promise<void>
}

export function Idle({ onStart }: Props) {
  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p className="muted" style={{ textAlign: 'center', margin: '24px 0' }}>
        未开始录制
      </p>
      <button type="button" className="btn-primary" onClick={() => void onStart()}>
        开启录制
      </button>
    </div>
  )
}
