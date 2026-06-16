/**
 * Recording v2 - Backend API 客户端
 *
 * 设计文档：design/docs/technical/agent-steer/recording.md
 *
 * 与 v1 backend.ts 的关键差异：
 *   - uploadSegmentBytes 返回 storage_key（后端生成，前端不拼）
 *   - registerSegment 返回 sequence（用于按时间排序）
 *   - 引入 30s fetch 超时
 *
 * 后端接口：
 *   POST   /workspaces/{code}/recordings
 *   PUT    /workspaces/{code}/recordings/{uid}/segments/{segmentUid}/bytes
 *   POST   /workspaces/{code}/recordings/{uid}/segments
 *   POST   /workspaces/{code}/recordings/{uid}/complete
 */

import { logger } from "@/common/logger";

// ==================== Types ====================

export interface ApiOptions {
	token: string;
	workspaceCode: string;
	backendUrl: string;
}

export interface CreateRecordingResult {
	uid: string;
	name: string;
	status: string;
}

export interface UploadSegmentResult {
	storage_key: string;
	size: number;
}

export interface RegisterSegmentResult {
	uid: string;
	sequence: number;
}

const API_TIMEOUT_MS = 30_000;

// ==================== Helpers ====================

function buildApiBase(backendUrl: string): string {
	return `${backendUrl.replace(/\/$/, "")}/api/v1`;
}

async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs = API_TIMEOUT_MS,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

async function readApiResponse<T>(res: Response, op: string): Promise<T> {
	if (res.status === 401) throw new Error(`${op}: token expired`);
	if (!res.ok) {
		const txt = await res.text();
		throw new Error(`${op} ${res.status}: ${txt.slice(0, 200)}`);
	}
	const json = (await res.json()) as { code: number; data: T };
	return json.data;
}

// ==================== API ====================

/**
 * 创建 Recording
 * POST /workspaces/{code}/recordings
 */
export async function createRecording(
	options: ApiOptions,
	params: { name: string; enterUrl?: string },
): Promise<CreateRecordingResult> {
	const apiBase = buildApiBase(options.backendUrl);
	const res = await fetchWithTimeout(
		`${apiBase}/workspaces/${options.workspaceCode}/recordings`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${options.token}`,
			},
			body: JSON.stringify({
				name: params.name,
				source: "agent",
				enter_url: params.enterUrl,
			}),
		},
	);
	const data = await readApiResponse<CreateRecordingResult>(
		res,
		"createRecording",
	);
	logger.cs.info("recording created", data.uid);
	return data;
}

/**
 * 上传 Segment bytes
 * PUT /workspaces/{code}/recordings/{uid}/segments/{segmentUid}/bytes
 *
 * 后端会生成 storage_key 并返回。前端**不要**自己拼。
 */
export async function uploadSegmentBytes(
	options: ApiOptions,
	params: { recordingUid: string; segmentUid: string; events: string },
): Promise<UploadSegmentResult> {
	const apiBase = buildApiBase(options.backendUrl);
	const res = await fetchWithTimeout(
		`${apiBase}/workspaces/${options.workspaceCode}/recordings/${params.recordingUid}/segments/${params.segmentUid}/bytes`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${options.token}`,
			},
			body: params.events,
		},
	);
	const data = await readApiResponse<UploadSegmentResult>(
		res,
		"uploadSegmentBytes",
	);
	logger.cs.debug("segment bytes uploaded", params.segmentUid);
	return data;
}

/**
 * 注册 Segment 元数据
 * POST /workspaces/{code}/recordings/{uid}/segments
 *
 * storage_key 来自 uploadSegmentBytes 的返回值，**不**自己拼。
 */
export async function registerSegment(
	options: ApiOptions,
	params: {
		recordingUid: string;
		segmentUid: string;
		startTime: number;
		endTime: number;
		pageUrls: string[];
		storageKey: string;
		size: number;
	},
): Promise<RegisterSegmentResult> {
	const apiBase = buildApiBase(options.backendUrl);
	const res = await fetchWithTimeout(
		`${apiBase}/workspaces/${options.workspaceCode}/recordings/${params.recordingUid}/segments`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${options.token}`,
			},
			body: JSON.stringify({
				start_time: new Date(params.startTime).toISOString(),
				end_time: new Date(params.endTime).toISOString(),
				page_urls: params.pageUrls,
				storage_key: params.storageKey,
				size: params.size,
			}),
		},
	);
	const data = await readApiResponse<RegisterSegmentResult>(
		res,
		"registerSegment",
	);
	logger.cs.debug("segment registered", {
		segmentUid: params.segmentUid,
		sequence: data.sequence,
	});
	return data;
}

/**
 * 完成 Recording
 * POST /workspaces/{code}/recordings/{uid}/complete
 */
export async function completeRecording(
	options: ApiOptions,
	params: { recordingUid: string; exitUrl?: string },
): Promise<void> {
	const apiBase = buildApiBase(options.backendUrl);
	const url = new URL(
		`${apiBase}/workspaces/${options.workspaceCode}/recordings/${params.recordingUid}/complete`,
	);
	if (params.exitUrl) url.searchParams.set("exit_url", params.exitUrl);

	const res = await fetchWithTimeout(url.toString(), {
		method: "POST",
		headers: { Authorization: `Bearer ${options.token}` },
	});
	await readApiResponse<unknown>(res, "completeRecording");
	logger.cs.info("recording completed", params.recordingUid);
}
