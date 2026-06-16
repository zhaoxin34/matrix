/**
 * RecordingUI v2 - 录制控制主组件
 *
 * 设计文档：design/docs/technical/agent-steer/recording.md
 *
 * 与 v1 的差异：
 *   - 状态机 7 状态 → 3 状态（idle / recording / paused）
 *   - view 8 个 → 2 个（IdleView + RecordingView，paused 是 RecordingView 内部态）
 *   - 没有"上传"相关 UI（v2 自动上传）
 *   - 没有"标注"UI（v2 不做标注）
 */

import { useRecordingState } from "./hooks/useRecordingState";
import { useRecordingCommands } from "./hooks/useRecordingCommands";
import { useViewState } from "./hooks/useViewState";
import { IdleView } from "./IdleView";
import { RecordingView } from "./RecordingView";

export interface RecordingUIProps {
	className?: string;
}

export function RecordingUI({ className }: RecordingUIProps) {
	const { state } = useRecordingState();
	const commands = useRecordingCommands();
	const view = useViewState(state.status);

	return (
		<div className={`recording-ui ${className ?? ""}`}>
			{view === "idle" ? (
				<IdleView onStart={commands.start} />
			) : (
				<RecordingView
					status={state.status}
					duration={state.duration}
					segmentCount={state.segmentCount}
					onPause={commands.pause}
					onResume={commands.resume}
					onStop={commands.stop}
				/>
			)}
		</div>
	);
}
