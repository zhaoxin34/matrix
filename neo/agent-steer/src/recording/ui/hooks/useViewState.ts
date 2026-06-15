/**
 * 视图状态计算 Hook
 */

import type {
	RecordingState,
	RecordingStatus,
	UploadProgress,
	PopupViewState,
} from "../../types";
import type { AuthState } from "./useAuthState";

interface UseViewStateOptions {
	recordingState: RecordingState;
	uploadProgress: UploadProgress | null;
	authState: AuthState;
	isLoading: boolean;
	showSettings: boolean;
	showUploadInput: boolean;
	recordingSegmentCount: number;
}

/**
 * 根据录制状态转换为视图状态
 */
function statusToViewState(status: RecordingStatus): PopupViewState {
	switch (status) {
		case "idle":
			return "Idle";
		case "recording":
			return "Recording";
		case "paused":
			return "Paused";
		case "pending":
			return "Pending";
		case "uploading":
			return "Uploading";
		case "success":
			return "Success";
		case "error":
			return "Error";
		default:
			return "Idle";
	}
}

export function useViewState(options: UseViewStateOptions): PopupViewState {
	const {
		recordingState,
		uploadProgress,
		authState,
		isLoading,
		showSettings,
		showUploadInput,
	} = options;

	// 视图优先级：Loading > Settings > UploadInput > Uploading > Success > Error > AuthRequired > 录制状态
	if (isLoading) return "Loading";
	if (showSettings) return "Settings";
	if (showUploadInput) return "UploadInput";

	if (uploadProgress?.status === "uploading") return "Uploading";
	if (uploadProgress?.status === "completed") return "Success";
	if (uploadProgress?.status === "failed") return "Error";

	if (!authState.isAuthenticated || !authState.isWorkspaceSelected) {
		return "AuthRequired";
	}

	// 使用录制状态直接映射到视图
	return statusToViewState(recordingState.status);
}
