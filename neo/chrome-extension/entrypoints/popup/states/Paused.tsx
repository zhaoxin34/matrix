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
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-base text-amber-600 font-medium mb-3">⏸ 已暂停</p>
      <dl className="text-sm text-gray-700 space-y-1 mb-4">
        <div className="flex justify-between">
          <dt>时长:</dt>
          <dd className="tabular-nums">{formatDuration(durationMs)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>片段:</dt>
          <dd className="tabular-nums">{segmentCount} 个</dd>
        </div>
      </dl>

      {showNameInput ? (
        <div className="space-y-2 mb-3">
          <label className="block text-xs text-gray-600">录像名称:</label>
          <input
            type="text"
            value={recordingName}
            onChange={(e) => onRecordingNameChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            placeholder="输入录像名称"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50"
              onClick={() => setShowNameInput(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="flex-1 px-2 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={async () => {
                await onUpload();
              }}
            >
              确认上传
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            className="w-full px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
            onClick={() => void onResume()}
          >
            继续录制
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setShowNameInput(true)}
          >
            上传
          </button>
          <button
            type="button"
            className="w-full px-2 py-1 text-xs text-red-600 hover:underline"
            onClick={() => void onStop()}
          >
            停止并清除
          </button>
        </div>
      )}
    </div>
  );
}
