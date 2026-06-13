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
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-base text-red-600 font-medium flex items-center gap-2 mb-3">
        <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse" />
        录制中
      </p>
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
      <button
        type="button"
        className="w-full px-3 py-2 text-sm rounded border border-gray-300 hover:bg-gray-50"
        onClick={() => void onPause()}
      >
        暂停
      </button>
    </div>
  );
}
