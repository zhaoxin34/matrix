/**
 * Background service worker.
 *
 * Handles:
 * - Injecting rrweb UMD build into pages
 * - Service Worker upload to Neo Backend API
 * - Message handling for Popup communication
 */

import {
  createSWMessageHandler,
  initUploader,
  cleanupUploader,
} from "../src/recording";

// 注入 recorder 到指定 tab
export async function injectRecorder(tabId: number): Promise<boolean> {
  console.log("[background] Injecting recorder into tab:", tabId);
  try {
    // 先注入 rrweb UMD
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["/rrweb-record.umd.min.js"],
      world: "MAIN",
    });
    console.log("[background] rrweb injected");

    // 再注入 recorder 脚本
    // 使用类型断言绕过 WXT 的严格类型检查
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (browser.scripting as any).executeScript({
      target: { tabId },
      files: ["/recorder.js"],
      world: "MAIN",
    });
    console.log("[background] Recorder injected successfully");
    return true;
  } catch (error) {
    console.error("[background] Failed to inject:", error);
    return false;
  }
}

// 进入debug页面 - 每次 extension 加载时执行
function entoDebugUrl(): void {
  console.log("[background] VITE_DEBUG =", import.meta.env.VITE_DEBUG);
  if (import.meta.env.VITE_DEBUG === "TRUE") {
    chrome.tabs.create({ url: "http://localhost:3000" });
  }
}

function initRecorder(): void {
  // 初始化上传模块
  initUploader().catch(console.error);

  // 注入 rrweb UMD 构建到新打开的页面
  browser.webNavigation?.onCommitted?.addListener(async (details) => {
    // 只注入主框架
    if (details.frameId !== 0) return;
    // 忽略扩展页面
    if (
      details.url.startsWith("chrome://") ||
      details.url.startsWith("moz-extension://") ||
      details.url.startsWith("about:blank") ||
      details.url.startsWith("devtools://")
    )
      return;

    // 异步注入
    injectRecorder(details.tabId);
  });

  // 处理 content script 的注入请求
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "injectRecorder" && sender.tab?.id) {
      injectRecorder(sender.tab.id).then((success) => {
        sendResponse({ success });
      });
      return true;
    }

    // 使用统一的 SW 消息处理器
    const messageHandler = createSWMessageHandler();
    messageHandler(message)
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        console.error("[background] Message handler error:", error);
        sendResponse({ success: false, error: String(error) });
      });

    return true;
  });

  // 清理
  self.addEventListener("unload", () => {
    cleanupUploader();
  });
}

export default defineBackground(() => {
  console.log("[background] hello", { id: browser.runtime.id });

  // 进入debug页面
  entoDebugUrl();

  // 初始化录像模块
  initRecorder();
});
