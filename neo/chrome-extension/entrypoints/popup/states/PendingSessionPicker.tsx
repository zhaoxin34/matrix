/**
 * PendingSessionPicker — shown when there are multiple unsynced sessions
 * and the user clicks "上传旧录像". Lets them pick which one to upload
 * and supply a recording name.
 */

import { useState } from "react";

import type { PendingGroup } from "../hooks/usePendingState";

interface Props {
  groups: PendingGroup[];
  recordingName: string;
  onRecordingNameChange: (v: string) => void;
  onConfirm: (sessionId: string) => void | Promise<void>;
  onCancel: () => void;
}

export function PendingSessionPicker({
  groups,
  recordingName,
  onRecordingNameChange,
  onConfirm,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<string | null>(groups[0]?.sessionId ?? null);

  return (
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p>请选择要上传的录像：</p>
      <div className="session-list">
        {groups.map((g) => (
          <label key={g.sessionId} className="session-item">
            <input
              type="radio"
              name="pending-session"
              value={g.sessionId}
              checked={selected === g.sessionId}
              onChange={() => setSelected(g.sessionId)}
            />
            <span className="session-label">
              Session {g.sessionId.slice(0, 8)}… ({g.segmentCount} 个片段)
            </span>
          </label>
        ))}
      </div>
      <label htmlFor="picker-name">录像名称:</label>
      <input
        id="picker-name"
        type="text"
        value={recordingName}
        onChange={(e) => onRecordingNameChange(e.target.value)}
        placeholder="输入录像名称"
      />
      <div className="btn-row popup-footer">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          取消
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={!selected}
          onClick={() => selected && void onConfirm(selected)}
        >
          上传所选
        </button>
      </div>
    </div>
  );
}
