/**
 * Recording v2 CS - rrweb 集成
 *
 * v2 cs 直接调 window.rrwebRecord 启动录制，事件流到内存 buffer。
 *
 * 3c 已知：v1 recorder.js（v1 sw 注入）也在跑，重复录制。
 * 阶段 5 清理 v1 时解决。
 */

import { logger } from "@/common/logger";

declare global {
	interface Window {
		rrwebRecord?: (opts: { emit: (e: unknown) => void }) => () => void;
	}
}

let events: unknown[] = [];
let stopFn: (() => void) | null = null;

/**
 * 启动 rrweb 录制
 * 返回 true = 成功；false = 已经在录 / rrwebRecord 不可用
 */
export function startRecording(): boolean {
	if (stopFn) {
		logger.cs.warn("recorder: 已经在录");
		return false;
	}
	if (typeof window.rrwebRecord !== "function") {
		logger.cs.error("recorder: window.rrwebRecord 不可用");
		return false;
	}
	events = [];
	stopFn = window.rrwebRecord({
		emit: (e) => {
			events.push(e);
		},
	});
	logger.cs.info("recorder: rrweb started");
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
