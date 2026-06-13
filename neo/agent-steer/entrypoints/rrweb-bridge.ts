/**
 * rrweb-bridge — unlisted script.
 *
 * 不进 content_scripts manifest，所以 Chrome 不会按 content script 的规则
 * 检 UTF-8。Background 在 tabs.onUpdated 时用 executeScript({world:'MAIN'})
 * 把它注入到 page main world。
 *
 * Plan B 验证点: rrweb 自带 18 个 CJK 字符 + 4 个 BOM 字面量在这个文件里,
 * 但因为它不是 content script, Chrome 应该不会报 "not UTF-8 encoded"。
 */
import { record } from "rrweb";
import type { eventWithTime } from "@rrweb/types";

export default defineUnlistedScript(() => {
	const stop = record({
		emit: (event: eventWithTime) => {
			window.postMessage(
				{
					source: "rrweb-bridge",
					type: "rrweb-event",
					payload: event,
				},
				"*",
			);
		},
	});
	console.log("[rrweb-bridge] recording started in page main world");
	return stop;
});
