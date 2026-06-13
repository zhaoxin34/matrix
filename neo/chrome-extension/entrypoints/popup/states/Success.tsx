/**
 * Success — upload completed. Shows a "查看回放" button that opens the
 * frontend URL in a new tab.
 */

interface Props {
  frontendUrl: string | null;
  onDone: () => void;
}

export function Success({ frontendUrl, onDone }: Props) {
  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p className="status-success">✅ 上传成功</p>
      <div className="stack popup-footer">
        {frontendUrl && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => chrome.tabs.create({ url: frontendUrl })}
          >
            查看回放
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onDone}>
          完成
        </button>
      </div>
    </div>
  );
}
