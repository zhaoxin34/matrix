/**
 * Background service worker.
 *
 * v2 阶段 5: SW 极薄壳
 * - v2 recording 不需要 SW 中转（popup 直连 CS + CS 监听 runtime.onMessage）
 * - 保留 SW 是因为 Manifest V3 强制要求
 * - 之前 v1 sw 注入 recorder.js 的逻辑（initRecorderInjection）已删除
 *   v2 cs 直接调 window.rrwebRecord（rrweb UMD 由 v1 public/rrweb-record.umd.min.js 提供）
 */

export default defineBackground(() => {
	console.log("[background] v2 hello", { id: browser.runtime.id });
});
