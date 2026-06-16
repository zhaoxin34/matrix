/**
 * CS Communicator 类型定义
 */

import type { RecordingState } from "../types";

/** 状态监听回调 */
export type StateListener = (state: RecordingState) => void;

/** 响应监听回调 */
export type ResponseListener = (response: {
	success: boolean;
	sessionId?: string;
	error?: string;
}) => void;

/** rrweb 响应结果 */
export interface RRWebResult {
	success: boolean;
	sessionId?: string;
	error?: string;
	isRecording?: boolean;
	isPaused?: boolean;
}

/** 命令参数 */
export interface CommandParams {
	requestId: string;
	command: "start" | "pause" | "resume" | "stop" | "reset" | "upload";
	payload?: UploadPayload;
}

/** 上传命令载荷（spike 阶段由 SW 转发，携带 token/workspaceCode/backendUrl） */
export interface UploadPayload {
	name?: string;
	token?: string;
	workspaceCode?: string;
	backendUrl?: string;
}
