"use client";

export function ThinkingIndicator() {
	return (
		<div className="flex items-center gap-2 text-sm text-muted-foreground italic animate-pulse">
			<span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
			<span className="inline-block h-2 w-2 rounded-full bg-blue-500 [animation-delay:0.2s]" />
			<span className="inline-block h-2 w-2 rounded-full bg-blue-500 [animation-delay:0.4s]" />
			<span>AI 正在思考...</span>
		</div>
	);
}
