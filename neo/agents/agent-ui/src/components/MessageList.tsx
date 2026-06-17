import { useEffect, useRef } from "react";
import type { AgentMessage } from "../types";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
	messages: AgentMessage[];
	isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isStreaming]);

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center text-muted-foreground">
					<p className="text-lg mb-2">🤖 Agent UI</p>
					<p className="text-sm">开始对话吧！</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
			{messages.map((message) => (
				<MessageItem key={message.id} message={message} />
			))}

			{/* Streaming indicator */}
			{isStreaming &&
				messages.length > 0 &&
				messages[messages.length - 1].role === "user" && (
					<div className="flex justify-start">
						<div className="bg-muted rounded-lg px-4 py-3">
							<div className="flex gap-1">
								<span
									className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
									style={{ animationDelay: "0ms" }}
								/>
								<span
									className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
									style={{ animationDelay: "150ms" }}
								/>
								<span
									className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
									style={{ animationDelay: "300ms" }}
								/>
							</div>
						</div>
					</div>
				)}

			<div ref={bottomRef} />
		</div>
	);
}
