interface AgentStatusProps {
	state: "disconnected" | "connecting" | "connected" | "error";
	messageCount?: number;
	sessionId?: string | null;
}

const stateConfig = {
	disconnected: {
		color: "bg-gray-400",
		label: "未连接",
	},
	connecting: {
		color: "bg-yellow-400 animate-pulse",
		label: "连接中...",
	},
	connected: {
		color: "bg-green-400",
		label: "已连接",
	},
	error: {
		color: "bg-red-400",
		label: "错误",
	},
};

export function AgentStatus({
	state,
	messageCount,
	sessionId,
}: AgentStatusProps) {
	const config = stateConfig[state];

	return (
		<div className="flex items-center gap-2 text-sm text-muted-foreground">
			<span className={`w-2 h-2 rounded-full ${config.color}`} />
			<span>{config.label}</span>
			{messageCount !== undefined && messageCount > 0 && (
				<span className="text-xs">({messageCount} 条消息)</span>
			)}
			{sessionId && (
				<span
					className="text-xs font-mono truncate max-w-[120px]"
					title={sessionId}
				>
					{sessionId.slice(0, 8)}...
				</span>
			)}
		</div>
	);
}
