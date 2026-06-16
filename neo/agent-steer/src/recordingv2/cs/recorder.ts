/**
 * Recording v2 CS - rrweb 集成
 *
 * rrweb UMD 由 SW 通过 browser.scripting.executeScript 注到 ISOLATED world，
 * v2 CS 直接调 window.rrwebRecord.record() 启动录制。
 *
 * 验证代码（保留）：bg 注 UMD + cs 保留验证 log
 */

import { logger } from "@/common/logger";

/**
 * rrweb UMD 导出格式：window.rrwebRecord 是对象 { record: fn }
 * record(opts) -> stopFn
 */
declare global {
	interface Window {
		rrwebRecord?: {
			record: (opts: { emit: (e: unknown) => void }) => () => void;
		};
	}
}

let events: unknown[] = [];
let stopFn: (() => void) | null = null;

/**
 * 轮询等待 SW 注好 rrweb UMD（最多 5 秒）
 * SW 在 background.ts 的 tabs.onUpdated 时注入到 ISOLATED world
 */
async function waitForRRWeb(timeoutMs = 5000): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		if (typeof window.rrwebRecord?.record === "function") {
			return true;
		}
		await new Promise((r) => setTimeout(r, 100));
	}
	return false;
}

/**
 * 启动 rrweb 录制
 * 返回 true = 成功；false = 已经在录 / rrwebRecord 不可用
 */
export async function startRecording(): Promise<boolean> {
	if (stopFn) {
		logger.cs.warn("recorder: 已经在录");
		return false;
	}

	// 轮询等 SW 注好 UMD（最多 5 秒）
	if (typeof window.rrwebRecord?.record !== "function") {
		logger.cs.info("recorder: 等 SW 注 rrweb UMD...");
		const ok = await waitForRRWeb();
		if (!ok) {
			logger.cs.error(
				"recorder: rrweb 未注入, window.rrwebRecord:",
				window.rrwebRecord,
			);
			return false;
		}
	}

	events = [];
	stopFn = window.rrwebRecord!.record({
		emit: (e) => {
			events.push(e);
		},
	});
	logger.cs.info("recorder: rrweb started, events:", events.length);
	return true;
}

/**
 * 停止 rrweb 录制
 */
export function stopRecording(): void {
	if (stopFn) {
		stopFn();
		stopFn = null;
		logger.cs.info("recorder: rrweb stopped, events:", events.length);
	}
}

/**
 * 获取当前 buffer 的事件
 */
export function getEvents(): unknown[] {
	return events;
}

/**
 * 清空 buffer（finishSegment 之后调用）
 */
export function clearEvents(): void {
	events = [];
}
