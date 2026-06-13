/**
 * Paused — recording is paused. Offers resume / upload / stop actions.
 * The upload flow collects a name and starts the upload.
 */

import { useState } from "react";

interface Props {
  durationMs: number;
  segmentCount: number;
  recordingName: string;
  onRecordingNameChange: (v: string) => void;
  onResume: () => void | Promise<void>;
  onUpload: () => void | Promise<void>;
  onStop: () => void | Promise<void>;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Paused({
  durationMs,
  segmentCount,
  recordingName,
  onRecordingNameChange,
  onResume,
  onUpload,
  onStop,
}: Props) {
  const [showNameInput, setShowNameInput] = useState(false);

  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p className="status-paused">⏸ 已暂停</p>
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

      {showNameInput ? (
        <div className="stack popup-footer">
          <label htmlFor="recording-name">录像名称:</label>
          <input
            id="recording-name"
            type="text"
            value={recordingName}
            onChange={(e) => onRecordingNameChange(e.target.value)}
            placeholder="输入录像名称"
            autoFocus
          />
          <div className="btn-row">
            <button type="button" className="btn-secondary" onClick={() => setShowNameInput(false)}>
              取消
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                await onUpload();
              }}
            >
              确认上传
            </button>
          </div>
        </div>
      ) : (
        <div className="stack popup-footer">
          <button type="button" className="btn-secondary" onClick={() => void onResume()}>
            继续录制
          </button>
          <button type="button" className="btn-primary" onClick={() => setShowNameInput(true)}>
            上传
          </button>
          <button
            type="button"
            className="btn-link"
            style={{ color: "#dc2626" }}
            onClick={() => void onStop()}
          >
            停止并清除
          </button>
        </div>
      )}
    </div>
  );
}
