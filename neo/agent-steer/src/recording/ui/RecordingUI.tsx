/**
 * RecordingUI - 录制控制的主组件
 */

import React from "react";
import { useRecordingState } from "./hooks/useRecordingState";

// 子组件
import { AuthRequiredView } from "./AuthRequiredView";
import { IdleView } from "./IdleView";
import { RecordingView } from "./RecordingView";
import { PausedView } from "./PausedView";
import { PendingView } from "./PendingView";
import { UploadPanel } from "./UploadPanel";
import { SuccessView } from "./SuccessView";
import { ErrorView } from "./ErrorView";
import { LoadingView } from "./LoadingView";
import { SettingsView } from "./SettingsView";

export interface RecordingUIProps {
	/** 自定义 className */
	className?: string;
	/** 隐藏上传按钮（默认 false） */
	hideUpload?: boolean;
	/** 上传前回调 */
	onBeforeUpload?: (name: string) => void | Promise<void>;
	/** 上传成功回调 */
	onUploadSuccess?: (recordingUid: string) => void;
	/** 上传失败回调 */
	onUploadError?: (error: string) => void;
}

export function RecordingUI(props: RecordingUIProps) {
	const {
		recordingState,
		uploadProgress,
		viewState,
		config,
		isUploading,
		uploadError,
		startRecording,
		pauseRecording,
		resumeRecording,
		startUpload,
		openNeo,
		retryAuth,
		openSettings,
		closeSettings,
		saveSettings,
	} = useRecordingState();

	// 根据 viewState 渲染对应的视图
	const renderView = () => {
		switch (viewState) {
			case "Settings":
				return (
					<SettingsView
						config={config}
						onSave={saveSettings}
						onCancel={closeSettings}
					/>
				);

			case "AuthRequired":
				return (
					<AuthRequiredView
						onOpenNeo={openNeo}
						onRetry={retryAuth}
						onOpenSettings={openSettings}
					/>
				);

			case "Idle":
				return <IdleView onStartRecording={startRecording} />;

			case "Recording":
				return (
					<RecordingView
						duration={recordingState.duration}
						segmentCount={recordingState.segmentCount}
						onPause={pauseRecording}
					/>
				);

			case "Paused":
				return (
					<PausedView
						duration={recordingState.duration}
						segmentCount={recordingState.segmentCount}
						onResume={resumeRecording}
						onUpload={() => startUpload("")} // TODO: 收集名称
						hideUpload={props.hideUpload}
					/>
				);

			case "Pending":
				return (
					<PendingView
						segmentCount={recordingState.segmentCount}
						onUpload={() => startUpload("")} // TODO: 收集名称
					/>
				);

			case "Uploading":
				return (
					<UploadPanel
						progress={uploadProgress?.progress ?? 0}
						onCancel={() => {}} // TODO: 实现取消
					/>
				);

			case "Success":
				return (
					<SuccessView
						onViewPlayback={() => {
							props.onUploadSuccess?.("");
							// TODO: 跳转到回放页面
						}}
					/>
				);

			case "Error":
				return (
					<ErrorView
						error={uploadError ?? "上传失败"}
						onRetry={() => startUpload("")}
						onCancel={() => {}}
					/>
				);

			default:
				return <LoadingView />;
		}
	};

	return (
		<div className={`recording-ui ${props.className ?? ""}`}>
			{renderView()}
		</div>
	);
}
