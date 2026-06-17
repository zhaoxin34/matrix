/**
 * RecordingView - 录制中 / 已暂停（v2）
 *
 * 同一组件按 status 条件渲染：
 *   - status === "recording"  → 录制中卡片 + [暂停] [停止]
 *   - status === "paused"     → 已暂停卡片 + [继续] [停止]
 *
 * 与 v1 的差异：
 *   - 取消了独立的 PausedView，paused 是 RecordingView 内部态
 *   - 取消了"上传/清除"按钮（v2 自动上传，没有"上传"概念）
 *   - 增加了 segment 计数显示（v2 切 segment 后递增）
 */

import { Pause, Play, Square, CirclePause, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { V2Status } from "../types";

type PendingAction = "pause" | "stop" | null;

interface RecordingViewProps {
	status: V2Status;
	duration: number;
	segmentCount: number;
	recordingUid?: string;
	workspaceCode?: string;
	frontendUrl?: string;
	pendingAction: PendingAction;
	onPause: () => void;
	onResume: () => void;
	onStop: () => void;
}

function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	if (hours > 0) {
		return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
	}
	return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function RecordingView({
	status,
	duration,
	segmentCount,
	recordingUid,
	workspaceCode,
	frontendUrl,
	pendingAction,
	onPause,
	onResume,
	onStop,
}: RecordingViewProps) {
	const isRecording = status === "recording";

	// 拼接查看录像链接
	const playbackUrl =
		recordingUid && workspaceCode && frontendUrl
			? `${frontendUrl}/workspace/${workspaceCode}/recordings/${recordingUid}/play`
			: null;

	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card
				className={`p-4 ${
					isRecording ? "border-[#f4212e]/20 bg-[#f4212e]/5" : ""
				}`}
			>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<Badge
							variant={isRecording ? "destructive" : "warning"}
							className="gap-1.5 px-3 py-1"
						>
							{isRecording ? (
								<>
									<span className="w-2 h-2 rounded-full bg-[#f4212e] animate-pulse" />
									录制中
								</>
							) : (
								<>
									<CirclePause className="w-3.5 h-3.5" />
									已暂停
								</>
							)}
						</Badge>
						<span
							className={`${
								isRecording ? "text-3xl" : "text-2xl"
							} font-mono font-bold text-[#e7e9ea] tracking-tight`}
						>
							{formatDuration(duration)}
						</span>
					</div>

					<div className="h-px bg-white/5" />

					<div className="flex items-center gap-4 text-xs text-[#8b98a5]">
						<span className="flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-[#8b98a5]" />
							片段: {segmentCount}
						</span>
						<span className="flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-[#00c853]" />
							状态正常
						</span>
					</div>
				</div>
			</Card>

			<div className="flex gap-2">
				{isRecording ? (
					<Button
						onClick={onPause}
						variant="secondary"
						size="lg"
						className="flex-1 gap-2"
						disabled={pendingAction !== null}
					>
						<Pause className="w-5 h-5" />
						{pendingAction === "pause" ? "提交中..." : "暂停录制"}
					</Button>
				) : (
					<Button
						onClick={onResume}
						size="lg"
						className="flex-1 gap-2"
						disabled={pendingAction !== null}
					>
						<Play className="w-5 h-5" />
						继续录制
					</Button>
				)}
				<Button
					onClick={onStop}
					variant="destructive"
					size="lg"
					className="flex-1 gap-2"
					disabled={pendingAction !== null}
				>
					<Square className="w-5 h-5 fill-current" />
					{pendingAction === "stop" ? "提交中..." : "停止录制"}
				</Button>
			</div>

			{playbackUrl && (
				<a
					href={playbackUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center gap-1.5 text-xs text-[#8b98a5] hover:text-[#1d9bf0] transition-colors"
				>
					<ExternalLink className="w-3.5 h-3.5" />
					查看录像
				</a>
			)}
		</div>
	);
}
