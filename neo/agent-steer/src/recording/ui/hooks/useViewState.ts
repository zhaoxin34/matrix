/**
 * 视图状态计算 Hook
 */

import type {
	RecordingState,
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

export function useViewState(options: UseViewStateOptions): PopupViewState {
	const {
		recordingState,
		uploadProgress,
		authState,
		isLoading,
		showSettings,
		showUploadInput,
	} = options;

	// 视图优先级：Loading > Settings > UploadInput > Uploading > Success > Error > AuthRequired > Pending > Recording > Paused > Idle
	if (isLoading) return "Loading";
	if (showSettings) return "Settings";
	if (showUploadInput) return "UploadInput";

	if (uploadProgress?.status === "uploading") return "Uploading";
	if (uploadProgress?.status === "completed") return "Success";
	if (uploadProgress?.status === "failed") return "Error";

	if (!authState.isAuthenticated || !authState.isWorkspaceSelected) {
		return "AuthRequired";
	}

	if (recordingState.segmentCount > 0 && !recordingState.isRecording) {
		return "Pending";
	}

	if (recordingState.isRecording && !recordingState.isPaused) {
		return "Recording";
	}

	if (recordingState.isPaused) return "Paused";

	return "Idle";
}
