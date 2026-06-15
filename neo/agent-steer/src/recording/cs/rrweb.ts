/**
 * CS 与 rrweb 通信
 */

import type { RRWebResult } from "./types";
import { notifyStateChange } from "./state";
import { logger } from "@/common/logger";

/** 消息源标识 - 从 CS 发出 */
const MESSAGE_SOURCE_CS = "recorder-control";

/** 消息源标识 - 从 rrweb recorder 响应 */
const MESSAGE_SOURCE_RRWEB = "recorder-response";

/** rrweb 消息 ID 计数器 */
let rrwebMessageIdCounter = 0;

/** 等待 rrweb 响应的 pending 消息 */
const pendingRRWebMessages = new Map<
	number,
	{
		resolve: (value: RRWebResult) => void;
		reject: (error: Error) => void;
	}
>();

/**
 * 发送消息到 rrweb recorder
 */
export function sendToRRWeb(
	action: string,
	payload?: unknown,
): Promise<RRWebResult> {
	return new Promise((resolve, reject) => {
		const id = ++rrwebMessageIdCounter;
		pendingRRWebMessages.set(id, { resolve, reject });

		logger.cs.info("发送消息到 rrweb:", { id, action, payload });

		window.postMessage(
			{
				source: MESSAGE_SOURCE_CS,
				type: "request",
				id,
				action,
				payload,
			},
			"*",
		);

		// 超时 10 秒
		setTimeout(() => {
			if (pendingRRWebMessages.has(id)) {
				pendingRRWebMessages.delete(id);
				logger.cs.error(`rrweb 消息超时: ${action}`);
				reject(new Error(`Message timeout: ${action}`));
			}
		}, 10000);
	});
}

/**
 * 设置 rrweb 监听器
 */
export function setupRRWebListener(): void {
	window.addEventListener("message", (event) => {
		if (event.source !== window || !event.data) return;

		// 处理 segment-saved 消息（来自 recorder）
		if (
			event.data.source === "recorder-state" &&
			event.data.type === "segment-saved"
		) {
			logger.cs.info("收到 segment 保存通知:", event.data);
			// 更新 segmentCount
			notifyStateChange({
				segmentCount: event.data.segmentSequence ?? 1,
			});
			return;
		}

		if (event.data.source !== MESSAGE_SOURCE_RRWEB) return;

		const { id, success, result, error } = event.data;
		const pending = pendingRRWebMessages.get(id);

		if (pending) {
			pendingRRWebMessages.delete(id);
			logger.cs.info("收到 rrweb 响应:", { id, success, result });
			if (success) {
				pending.resolve(result);
			} else {
				pending.reject(new Error(error || "Unknown error"));
			}
		}
	});
}
