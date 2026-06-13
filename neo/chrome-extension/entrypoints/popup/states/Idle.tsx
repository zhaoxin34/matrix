/**
 * Idle — shown when the user is authenticated and not currently recording.
 * The only action is to start a new recording.
 */

interface Props {
  onStart: () => void | Promise<void>;
}

export function Idle({ onStart }: Props) {
  return (
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-sm text-gray-500 text-center my-6">未开始录制</p>
      <button
        type="button"
        className="w-full px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => void onStart()}
      >
        开启录制
      </button>
    </div>
  );
}
