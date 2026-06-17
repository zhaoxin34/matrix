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

import { useEffect, useState } from "react";
import { useRecordingState } from "./hooks/useRecordingState";
import { useRecordingCommands } from "./hooks/useRecordingCommands";
import { useViewState } from "./hooks/useViewState";
import { IdleView } from "./IdleView";
import { RecordingView } from "./RecordingView";

export interface RecordingUIProps {
	className?: string;
}

/** 正在提交中的操作（用于 disabled 按钮） */
type PendingAction = "pause" | "stop" | null;
export function RecordingUI({ className }: RecordingUIProps) {
	const { state } = useRecordingState();
	const commands = useRecordingCommands();
	const view = useViewState(state.status);
	const [pendingAction, setPendingAction] = useState<PendingAction>(null);

	// popup 打开时主动查询 CS 当前状态（解决关闭再打开 → Idle 的竞态）
	useEffect(() => {
		commands.queryState();
	}, []);

	const handlePause = async () => {
		setPendingAction("pause");
		await commands.pause();
		setPendingAction(null);
	};

	const handleStop = async () => {
		setPendingAction("stop");
		await commands.stop();
		setPendingAction(null);
	};

	return (
		<div className={`recording-ui ${className ?? ""}`}>
			{view === "idle" ? (
				<IdleView onStart={commands.start} />
			) : (
				<RecordingView
					status={state.status}
					duration={state.duration}
					segmentCount={state.segmentCount}
					pendingAction={pendingAction}
					onPause={handlePause}
					onResume={commands.resume}
					onStop={handleStop}
				/>
			)}
		</div>
	);
}
