/**
 * Recording v2 - Segment 切分生命周期
 *
 * 设计文档：design/docs/technical/agent-steer/recording.md
 *
 * finishSegment 是"切 segment"的统一抽象,所有 4 个切分时机都走这个函数。
 * 变体 (Continue / Pause / Stop) 仅在 finishSegment 之后做不同动作:
 *   - Continue: 切完继续录制(启动新 segment)
 *   - Pause:    切完停在 paused 状态
 *   - Stop:     切完调 complete,recording 结束
 *
 * 本模块**不**做:
 *   - rrweb 启动/停止(buffer 数据由调用方提供)
 *   - 状态机切换(由 lifecycle 调用方负责)
 *   - 触发点监听(10 分钟定时/visibilitychange/idle,由阶段 3 接入)
 */

import { logger } from "@/common/logger";
import {
	completeRecording,
	type ApiOptions,
} from "./api";
import {
	uploadSegmentBytes,
	registerSegment,
} from "./api";

// ==================== Types ====================

export interface SegmentFinishParams {
	/** 必传, 由调用方生成以保证切 segment 时 segmentUid 已确定 */
	segmentUid: string;
	/** JSON 序列化的 rrweb 事件 */
	events: string;
	/** Segment 起始时间 (ms) */
	startTime: number;
	/** Segment 结束时间 (ms) */
	endTime: number;
	/** Segment 内访问过的 URL 列表 */
	pageUrls: string[];
}

export interface SegmentFinishResult {
	segmentUid: string;
	sequence: number;
	size: number;
}

export interface FinishOptions extends ApiOptions {
	recordingUid: string;
}

// ==================== Core ====================

/**
 * finishSegment - 切一个 segment 并上传
 *
 * 流程:
 *   1. PUT  /recordings/{uid}/segments/{segmentUid}/bytes
 *   2. POST /recordings/{uid}/segments (注册元信息)
 *
 * 不负责:
 *   - rrweb.stop() / buffer 清空
 *   - 状态机切换
 *   - 后续是否继续录制
 *
 * 错误处理: 任意一步失败,函数抛错。调用方决定是否重试或继续。
 */
export async function finishSegment(
	options: FinishOptions,
	params: SegmentFinishParams,
): Promise<SegmentFinishResult> {
	logger.cs.info("finishSegment: 开始", { segmentUid: params.segmentUid });

	// 1. 上传 bytes
	const { storage_key, size } = await uploadSegmentBytes(options, {
		recordingUid: options.recordingUid,
		segmentUid: params.segmentUid,
		events: params.events,
	});

	// 2. 注册 segment
	const { sequence } = await registerSegment(options, {
		recordingUid: options.recordingUid,
		segmentUid: params.segmentUid,
		startTime: params.startTime,
		endTime: params.endTime,
		pageUrls: params.pageUrls,
		storageKey: storage_key,
		size,
	});

	logger.cs.info("finishSegment: 完成", {
		segmentUid: params.segmentUid,
		sequence,
	});
	return { segmentUid: params.segmentUid, sequence, size };
}

// ==================== 3 个变体 ====================

/**
 * finishAndContinue - 切完继续录制
 *
 * 与 finishSegment 后端动作相同。"启动新 segment" 由调用方负责
 * (rrweb 重新收集 + 状态机切回 recording)。
 */
export async function finishAndContinue(
	options: FinishOptions,
	params: SegmentFinishParams,
): Promise<SegmentFinishResult> {
	return finishSegment(options, params);
}

/**
 * finishAndPause - 切完进入 paused
 *
 * 与 finishSegment 后端动作相同。"状态切到 paused" 由调用方负责
 * (CS 状态机切到 paused + UI 状态更新)。
 */
export async function finishAndPause(
	options: FinishOptions,
	params: SegmentFinishParams,
): Promise<SegmentFinishResult> {
	return finishSegment(options, params);
}

/**
 * finishAndStop - 切完结束 recording
 *
 * 1. finishSegment (切最后一段 + 上传)
 * 2. POST /recordings/{uid}/complete
 */
export async function finishAndStop(
	options: FinishOptions,
	params: SegmentFinishParams,
): Promise<SegmentFinishResult> {
	const result = await finishSegment(options, params);
	logger.cs.info("finishAndStop: complete recording", {
		recordingUid: options.recordingUid,
	});
	await completeRecording(options, { recordingUid: options.recordingUid });
	return result;
}

// ==================== Utilities ====================

/**
 * 生成 segmentUid
 * 后端约束: ^[A-Za-z0-9_-]{1,128}$
 * crypto.randomUUID() 返回 "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" 格式,符合约束
 */
export function generateSegmentUid(): string {
	return crypto.randomUUID();
}
