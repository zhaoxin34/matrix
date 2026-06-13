/**
 * Uploading — shown while the 4-step upload flow is in progress.
 * Minimal: spinner + recording name.
 */

interface Props {
  recordingName: string;
}

export function Uploading({ recordingName }: Props) {
  return (
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-700">正在上传…</p>
        {recordingName && <p className="text-xs text-gray-500 mt-1">{recordingName}</p>}
      </div>
    </div>
  );
}
