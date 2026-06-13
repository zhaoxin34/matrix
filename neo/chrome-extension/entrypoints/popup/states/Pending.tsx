/**
 * Pending — shown when the popup detects unsynced segments in
 * IndexedDB (e.g. after a browser restart). Offers three actions:
 *   - 上传旧录像 (upload old)
 *   - 丢弃旧录像 (discard)
 *   - 新开一段 (start new — leaves old segments in place)
 *
 * If multiple sessions have unsynced segments, the user is asked to
 * pick one via PendingSessionPicker before upload.
 */

import { useState } from "react";

import { PendingSessionPicker } from "./PendingSessionPicker";
import type { PendingGroup } from "../hooks/usePendingState";

interface Props {
  groups: PendingGroup[];
  onUpload: (sessionId: string) => Promise<void>;
  onDiscard: (sessionId: string) => Promise<void>;
  onStartNew: () => Promise<void>;
  recordingName: string;
  onRecordingNameChange: (v: string) => void;
}

function formatTotalDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function Pending({
  groups,
  onUpload,
  onDiscard,
  onStartNew,
  recordingName,
  onRecordingNameChange,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (pickerOpen) {
    return (
      <PendingSessionPicker
        groups={groups}
        recordingName={recordingName}
        onRecordingNameChange={onRecordingNameChange}
        onConfirm={async (sessionId) => {
          setPickerOpen(false);
          await onUpload(sessionId);
        }}
        onCancel={() => setPickerOpen(false)}
      />
    );
  }

  const totalSegments = groups.reduce((sum, g) => sum + g.segmentCount, 0);
  const totalDuration = groups.reduce((sum, g) => sum + g.totalDuration, 0);
  const earliest = Math.min(...groups.map((g) => g.earliestStart));
  const dateStr = new Date(earliest).toLocaleString();

  return (
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-sm text-amber-700 font-medium mb-2">⏸ 检测到未上传录像</p>
      <dl className="text-xs text-gray-700 space-y-1 mb-4">
        <div className="flex justify-between">
          <dt>片段数:</dt>
          <dd className="tabular-nums">{totalSegments} 个</dd>
        </div>
        <div className="flex justify-between">
          <dt>总时长:</dt>
          <dd className="tabular-nums">{formatTotalDuration(totalDuration)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>开始于:</dt>
          <dd>{dateStr}</dd>
        </div>
      </dl>

      {confirming ? (
        <div className="space-y-2">
          <p className="text-xs text-red-700">确认丢弃？此操作不可恢复。</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50"
              onClick={() => setConfirming(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="flex-1 px-2 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
              onClick={async () => {
                for (const g of groups) {
                  await onDiscard(g.sessionId);
                }
                setConfirming(false);
              }}
            >
              确认丢弃
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            className="w-full px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setPickerOpen(true)}
          >
            上传旧录像
          </button>
          <button
            type="button"
            className="w-full px-2 py-1.5 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => setConfirming(true)}
          >
            丢弃旧录像
          </button>
          <button
            type="button"
            className="w-full px-2 py-1.5 text-xs text-gray-600 hover:underline"
            onClick={() => void onStartNew()}
          >
            新开一段
          </button>
        </div>
      )}
    </div>
  );
}
