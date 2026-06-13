/**
 * Error — shown when the upload (or another action) failed. Provides
 * a retry button and a cancel button.
 */

interface Props {
  error: string;
  onRetry: () => void | Promise<void>;
  onCancel: () => void;
}

export function Error({ error, onRetry, onCancel }: Props) {
  return (
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-base text-red-600 font-medium mb-2">❌ 出错了</p>
      <p className="text-xs text-gray-700 bg-red-50 border border-red-200 rounded p-2 mb-4 break-all">
        {error}
      </p>
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
          className="flex-1 px-2 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => void onRetry()}
        >
          重试
        </button>
      </div>
    </div>
  );
}
