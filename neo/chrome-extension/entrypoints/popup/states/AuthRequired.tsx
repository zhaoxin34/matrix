/**
 * AuthRequired — shown when the popup can't authenticate.
 *
 * Variants (from auth status):
 *   - not_authenticated: "请先登录 Neo"
 *   - no_workspace:      "请先选择工作区"
 *   - timeout:           "无法连接到 Neo，请检查网络"
 *
 * Always renders an invisible iframe so the postMessage bridge can
 * deliver the user info payload even before the user has logged in.
 */

import { useEffect, useState } from "react";

import type { AuthStatus } from "../../../src/auth/types";
import { getConfig } from "../../../src/config/settings";
import { loadUserInfoFromIframe } from "../../../src/auth/iframe-bridge";

interface Props {
  status: AuthStatus;
  onRetry: () => void;
  getFrontendUrl: () => Promise<string>;
}

const MESSAGES: Record<AuthStatus, string> = {
  not_authenticated: "请先登录 Neo",
  no_workspace: "请先在 Neo 中选择工作区",
  timeout: "无法连接到 Neo，请检查网络",
  ok: "",
};

export function AuthRequired({ status, onRetry, getFrontendUrl }: Props) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  // Try to set up the iframe on mount and on retry. If config is missing
  // (e.g. user hasn't set frontend_base_url), we silently skip — the
  // user will see the "请先配置" message below via the message.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await getConfig();
      if (cancelled) return;
      if (r.ok) {
        setIframeSrc(
          `${r.config.frontend_base_url}${r.config.user_info_path}?v=1&source=agent_steer`,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onRetry]);

  const message = MESSAGES[status] || MESSAGES.not_authenticated;
  const isTimeout = status === "timeout";

  return (
    <div className="w-72 p-3 font-sans">
      <header className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
        🔧 Agent Steer
      </header>
      <p className="text-sm text-amber-700 mb-1">⚠️ {message}</p>
      <p className="text-xs text-gray-500 mb-3">
        打开 Neo 并完成操作后重新打开此弹窗
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-50"
          onClick={async () => {
            const url = await getFrontendUrl();
            if (url) chrome.tabs.create({ url });
          }}
        >
          打开 Neo
        </button>
        <button
          type="button"
          className={`flex-1 px-2 py-1.5 text-xs rounded text-white ${isTimeout ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}
          onClick={onRetry}
        >
          重试
        </button>
      </div>
      {/* Hidden iframe keeps the postMessage bridge alive. */}
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          title="agent-steer-user-info"
          aria-hidden="true"
          style={{ display: "none" }}
        />
      )}
    </div>
  );
}
