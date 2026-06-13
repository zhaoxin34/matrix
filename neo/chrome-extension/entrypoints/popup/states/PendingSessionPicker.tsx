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
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-sm text-gray-700 mb-2">请选择要上传的录像：</p>
      <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
        {groups.map((g) => (
          <label
            key={g.sessionId}
            className="flex items-center gap-2 p-1.5 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
          >
            <input
              type="radio"
              name="pending-session"
              value={g.sessionId}
              checked={selected === g.sessionId}
              onChange={() => setSelected(g.sessionId)}
            />
            <span className="text-xs text-gray-700">
              Session {g.sessionId.slice(0, 8)}… ({g.segmentCount} 个片段)
            </span>
          </label>
        ))}
      </div>
      <label className="block text-xs text-gray-600 mb-1">录像名称:</label>
      <input
        type="text"
        value={recordingName}
        onChange={(e) => onRecordingNameChange(e.target.value)}
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded mb-3"
        placeholder="输入录像名称"
      />
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50"
          onClick={onCancel}
        >
          取消
        </button>
        <button
          type="button"
          className="flex-1 px-2 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
          disabled={!selected}
          onClick={() => selected && void onConfirm(selected)}
        >
          上传所选
        </button>
      </div>
    </div>
  );
}
