/**
 * Recording — active recording state. Shows duration + segment count and
 * a pause button. Red dot indicates active state per product design.
 */

interface Props {
  durationMs: number;
  segmentCount: number;
  onPause: () => void | Promise<void>;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Recording({ durationMs, segmentCount, onPause }: Props) {
  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p className="status-recording">
        <span className="dot-recording" />
        录制中
      </p>
      <dl className="dl">
        <div>
          <dt>时长:</dt>
          <dd className="tabular">{formatDuration(durationMs)}</dd>
        </div>
        <div>
          <dt>片段:</dt>
          <dd className="tabular">{segmentCount} 个</dd>
        </div>
      </dl>
      <button type="button" className="btn-secondary" onClick={() => void onPause()}>
        暂停
      </button>
    </div>
  );
}
