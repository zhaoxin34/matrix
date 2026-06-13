/**
 * Success — upload completed. Shows a "查看回放" button that opens the
 * frontend URL in a new tab.
 */

interface Props {
  frontendUrl: string | null;
  onDone: () => void;
}

export function Success({ frontendUrl, onDone }: Props) {
  return (
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-base text-green-600 font-medium mb-4 text-center">✅ 上传成功</p>
      <div className="space-y-2">
        {frontendUrl && (
          <button
            type="button"
            className="w-full px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => chrome.tabs.create({ url: frontendUrl })}
          >
            查看回放
          </button>
        )}
        <button
          type="button"
          className="w-full px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50"
          onClick={onDone}
        >
          完成
        </button>
      </div>
    </div>
  );
}
