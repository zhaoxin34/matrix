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
    <div className="popup">
      <header className="popup-header">🔧 Agent Steer</header>
      <p className="status-warning-strong">⏸ 检测到未上传录像</p>
      <dl className="dl">
        <div>
          <dt>片段数:</dt>
          <dd className="tabular">{totalSegments} 个</dd>
        </div>
        <div>
          <dt>总时长:</dt>
          <dd className="tabular">{formatTotalDuration(totalDuration)}</dd>
        </div>
        <div>
          <dt>开始于:</dt>
          <dd>{dateStr}</dd>
        </div>
      </dl>

      {confirming ? (
        <div className="stack popup-footer">
          <p className="status-error" style={{ fontSize: "12px" }}>确认丢弃？此操作不可恢复。</p>
          <div className="btn-row">
            <button type="button" className="btn-secondary" onClick={() => setConfirming(false)}>
              取消
            </button>
            <button
              type="button"
              className="btn-danger-solid"
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
        <div className="stack popup-footer">
          <button type="button" className="btn-primary" onClick={() => setPickerOpen(true)}>
            上传旧录像
          </button>
          <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
            丢弃旧录像
          </button>
          <button type="button" className="btn-link" onClick={() => void onStartNew()}>
            新开一段
          </button>
        </div>
      )}
    </div>
  );
}
