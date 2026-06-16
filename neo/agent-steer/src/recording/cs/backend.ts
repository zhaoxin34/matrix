/**
 * Backend API 客户端
 *
 * 负责与后端 API 通信，包括：
 * - 创建/完成 recording
 * - 上传 segment 数据和元数据
 */

import type { Segment } from "../types";
import { logger } from "@/common/logger";

// ==================== 类型定义 ====================

export interface RecordingResponse {
	uid: string;
	name: string;
	workspaceCode: string;
	status: string;
}

export interface SegmentMetadata {
	start_time: string;
	end_time: string;
	page_urls: string[];
	storage_key: string;
	size: number;
}

export interface UploadOptions {
	token: string;
	workspaceCode: string;
	backendUrl: string;
}

// ==================== API 客户端 ====================

/**
 * 创建 Recording
 */
export async function createRecording(
	options: UploadOptions,
	name: string,
): Promise<RecordingResponse> {
	const { token, workspaceCode, backendUrl } = options;
	const apiBase = `${backendUrl.replace(/\/$/, "")}/api/v1`;

	const response = await fetch(
		`${apiBase}/workspaces/${workspaceCode}/recordings`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ name, source: "agent" }),
		},
	);

	if (response.status === 401) {
		throw new Error("token expired");
	}
	if (!response.ok) {
		const txt = await response.text();
		throw new Error(`createRecording ${response.status}: ${txt.slice(0, 200)}`);
	}

	const json = await response.json();
	logger.cs.info("Backend: recording created", json.data.uid);
	return json.data;
}

/**
 * 上传 Segment 数据（bytes）
 */
export async function uploadSegmentBytes(
	options: UploadOptions,
	recordingUid: string,
	segment: Segment,
): Promise<void> {
	const { token, workspaceCode, backendUrl } = options;
	const apiBase = `${backendUrl.replace(/\/$/, "")}/api/v1`;
	const eventsText: string = segment.events;

	const response = await fetch(
		`${apiBase}/workspaces/${workspaceCode}/recordings/${recordingUid}/segments/${segment.uid}/bytes`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: eventsText,
		},
	);

	if (response.status === 401) {
		throw new Error("token expired");
	}
	if (!response.ok) {
		const txt = await response.text();
		throw new Error(`uploadSegmentBytes ${segment.uid} ${response.status}: ${txt.slice(0, 200)}`);
	}

	logger.cs.debug("Backend: segment bytes uploaded", segment.uid);
}

/**
 * 注册 Segment 元数据
 */
export async function registerSegment(
	options: UploadOptions,
	recordingUid: string,
	segment: Segment,
): Promise<void> {
	const { token, workspaceCode, backendUrl } = options;
	const apiBase = `${backendUrl.replace(/\/$/, "")}/api/v1`;

	const storageKey = `neo/workspace_${workspaceCode}/recording/${recordingUid}/${segment.uid}.rrweb.json`;
	const eventsText: string = segment.events;

	const metadata: SegmentMetadata = {
		start_time: new Date(segment.startTime).toISOString(),
		end_time: new Date(segment.endTime).toISOString(),
		page_urls: segment.pageUrls ?? [],
		storage_key: storageKey,
		size: new Blob([eventsText]).size,
	};

	const response = await fetch(
		`${apiBase}/workspaces/${workspaceCode}/recordings/${recordingUid}/segments`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(metadata),
		},
	);

	if (!response.ok) {
		const txt = await response.text();
		throw new Error(`registerSegment ${segment.uid} ${response.status}: ${txt.slice(0, 200)}`);
	}

	logger.cs.debug("Backend: segment registered", segment.uid);
}

/**
 * 标记 Recording 完成
 */
export async function completeRecording(
	options: UploadOptions,
	recordingUid: string,
): Promise<void> {
	const { token, workspaceCode, backendUrl } = options;
	const apiBase = `${backendUrl.replace(/\/$/, "")}/api/v1`;

	const response = await fetch(
		`${apiBase}/workspaces/${workspaceCode}/recordings/${recordingUid}/complete`,
		{
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
		},
	);

	if (!response.ok) {
		const txt = await response.text();
		throw new Error(`completeRecording ${response.status}: ${txt.slice(0, 200)}`);
	}

	logger.cs.info("Backend: recording completed", recordingUid);
}

// ==================== 高级接口 ====================

export interface UploadCallbacks {
	onProgress?: (progress: number, currentSegment: number, totalSegments: number) => void;
	onSegmentUploaded?: (segmentUid: string, index: number) => void;
}

/**
 * 上传所有 Segments
 */
export async function uploadSegments(
	options: UploadOptions,
	recordingUid: string,
	segments: Segment[],
	callbacks?: UploadCallbacks,
): Promise<void> {
	const { onProgress, onSegmentUploaded } = callbacks ?? {};

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];

		// 上传 bytes
		await uploadSegmentBytes(options, recordingUid, segment);

		// 注册元数据
		await registerSegment(options, recordingUid, segment);

		// 回调
		onSegmentUploaded?.(segment.uid, i);
		onProgress?.(Math.round(((i + 1) / segments.length) * 100), i + 1, segments.length);

		logger.cs.info(`Backend: segment ${i + 1}/${segments.length} uploaded`);
	}
}
