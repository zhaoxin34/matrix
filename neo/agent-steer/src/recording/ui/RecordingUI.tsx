/**
 * RecordingUI - 录制控制的主组件
 *
 * 注意：此组件只处理录制相关的状态（Idle, Recording, Paused, Pending, UploadInput, Uploading, Success, Error, Loading）。
 * AuthRequired 和 Settings 状态由外部 App.tsx 处理。
 */

import { usePopupController } from "./hooks";

// 子组件
import { IdleView } from "./IdleView";
import { RecordingView } from "./RecordingView";
import { PausedView } from "./PausedView";
import { PendingView } from "./PendingView";
import { UploadInputView } from "./UploadInputView";
import { UploadProgressView } from "./UploadProgressView";
import { SuccessView } from "./SuccessView";
import { ErrorView } from "./ErrorView";
import { LoadingView } from "./LoadingView";

export interface RecordingUIProps {
	/** 自定义 className */
	className?: string;
	/** 隐藏上传按钮（默认 false） */
	hideUpload?: boolean;
	/** Neo Frontend URL,用于成功跳转回放页 */
	neoUrl?: string;
	/** 当前工作区 code,用于成功跳转回放页 */
	workspaceCode?: string;
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
		showUploadInput,
		confirmUpload,
		cancelUpload,
		clearRecording,
		startRecording,
		pauseRecording,
		resumeRecording,
		stopRecording,
	} = usePopupController();

	// 根据 viewState 渲染对应的视图
	// 注意：AuthRequired 和 Settings 由外部 App.tsx 处理
	const renderView = () => {
		switch (viewState) {
			case "Loading":
				return <LoadingView />;

			case "Idle":
				return <IdleView onStartRecording={startRecording} />;

			case "Recording":
				return (
					<RecordingView
						duration={recordingState.duration}
						segmentCount={recordingState.segmentCount}
						onPause={pauseRecording}
						onStop={stopRecording}
					/>
				);

			case "Paused":
				return (
					<PausedView
						duration={recordingState.duration}
						segmentCount={recordingState.segmentCount}
						onResume={resumeRecording}
						onUpload={showUploadInput}
						onClear={clearRecording}
						hideUpload={props.hideUpload}
					/>
				);

			case "Pending":
				return (
					<PendingView
						segmentCount={recordingState.segmentCount}
						onUpload={showUploadInput}
						onClear={clearRecording}
					/>
				);

			case "UploadInput":
				return (
					<UploadInputView onConfirm={confirmUpload} onCancel={cancelUpload} />
				);

			case "Uploading":
				return (
					<UploadProgressView
						progress={uploadProgress}
						onCancel={cancelUpload}
					/>
				);

			case "Success":
				return (
					<SuccessView
						neoUrl={props.neoUrl}
						workspaceCode={props.workspaceCode}
						recordingUid={uploadProgress?.recordingUid}
						onViewPlayback={() => {
							props.onUploadSuccess?.(uploadProgress?.recordingUid ?? "");
						}}
					/>
				);

			case "Error":
				return (
					<ErrorView
						error={uploadProgress?.error ?? "上传失败"}
						onRetry={() => {}} // 重新上传需要输入名称
						onCancel={cancelUpload}
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
