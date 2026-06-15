/**
 * Background service worker.
 *
 * 职责：
 * - 初始化 SW 通信层
 * - 处理跨域请求
 */

import { initSWCommunicator } from "../src/recording";

// 进入debug页面 - 每次 extension 加载时执行
function entoDebugUrl(): void {
  console.log("[background] VITE_DEBUG =", import.meta.env.VITE_DEBUG);
  if (import.meta.env.OPEN_DEBUG_PAGE === "TRUE") {
    // 在 Playwright e2e 测试环境中不创建 debug tab
    // 否则会导致 getCurrentTabId() 获取到错误的 tab
    const isTest =
      typeof process !== "undefined" && process.env.NODE_ENV === "test";
    if (!isTest) {
      chrome.tabs.create({ url: "http://localhost:3000" });
    }
  }
}

export default defineBackground(() => {
  console.log("[background] hello", { id: browser.runtime.id });

  // 进入debug页面
  entoDebugUrl();

  // 初始化 SW 通信层
  initSWCommunicator();
});
