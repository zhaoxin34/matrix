"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { InterviewMessage } from "@/lib/hooks/use-agent-interview";

interface ChatWindowProps {
	messages: InterviewMessage[];
	currentQuestionIndex: number;
	totalQuestions: number;
	isComplete: boolean;
	onSubmitAnswer: (answer: string) => void;
	onEndInterview: () => void;
	disabled?: boolean;
}

export function ChatWindow({
	messages,
	currentQuestionIndex,
	totalQuestions,
	isComplete,
	onSubmitAnswer,
	onEndInterview,
	disabled = false,
}: ChatWindowProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [inputValue, setInputValue] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages]);

	// Focus textarea when not disabled
	useEffect(() => {
		if (!disabled && !isComplete && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [disabled, isComplete, currentQuestionIndex]);

	const handleSubmit = () => {
		const text = inputValue.trim();
		if (!text || isSubmitting || disabled) return;

		setIsSubmitting(true);
		onSubmitAnswer(text);
		setInputValue("");
		setIsSubmitting(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("zh-CN", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="flex flex-col h-full">
			{/* Progress Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
				<div className="flex items-center gap-3">
					<Badge variant="outline" className="font-mono text-xs">
						{currentQuestionIndex + 1} / {totalQuestions}
					</Badge>
					{!isComplete && (
						<span className="text-xs text-muted-foreground">
							回答将被保存到知识库
						</span>
					)}
				</div>
				{isComplete && (
					<Badge className="bg-green-100 text-green-800 hover:bg-green-100">
						访谈已完成
					</Badge>
				)}
			</div>

			{/* Messages Area */}
			<ScrollArea ref={scrollRef} className="flex-1 p-4">
				<div className="space-y-4 max-w-2xl mx-auto">
					{messages.map((msg) => (
						<MessageBubble key={msg.id} message={msg} formatTime={formatTime} />
					))}
				</div>
			</ScrollArea>

			{/* Input Area */}
			{!isComplete && (
				<div className="p-4 border-t bg-background">
					<div className="flex gap-2 max-w-2xl mx-auto">
						<Textarea
							ref={textareaRef}
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="输入你的回答，按 Enter 发送..."
							className="min-h-[60px] max-h-[200px] resize-none"
							disabled={disabled || isSubmitting}
						/>
						<div className="flex flex-col gap-2">
							<Button
								onClick={handleSubmit}
								disabled={!inputValue.trim() || disabled || isSubmitting}
								className="flex-shrink-0"
							>
								发送
							</Button>
							<Button
								variant="outline"
								onClick={onEndInterview}
								disabled={disabled}
								className="flex-shrink-0 text-xs"
							>
								结束访谈
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Complete State */}
			{isComplete && (
				<div className="p-4 border-t bg-muted/30">
					<div className="max-w-2xl mx-auto text-center">
						<p className="text-sm text-muted-foreground mb-3">
							感谢参与访谈！你的回答已保存到知识库。
						</p>
						<Button variant="outline" onClick={onEndInterview}>
							返回列表
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

interface MessageBubbleProps {
	message: InterviewMessage;
	formatTime: (date: Date) => string;
}

function MessageBubble({ message, formatTime }: MessageBubbleProps) {
	const isAI = message.role === "ai";
	const isExpert = message.role === "expert";
	const isSystem = message.role === "system";

	if (isSystem) {
		return (
			<div className="flex justify-center">
				<div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
					<span>{message.content}</span>
					<span className="text-muted-foreground/60">
						{formatTime(message.timestamp)}
					</span>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex",
				isAI ? "justify-start" : isExpert ? "justify-end" : "justify-center",
			)}
		>
			<div
				className={cn(
					"max-w-[80%] rounded-2xl px-4 py-3",
					isAI && "bg-blue-50 text-blue-900 rounded-tl-sm",
					isExpert && "bg-green-50 text-green-900 rounded-tr-sm",
				)}
			>
				<div className="flex items-center gap-2 mb-1">
					<span className="text-xs font-medium">
						{isAI ? "🤖 AI 访谈助手" : isExpert ? "👤 专家" : "ℹ️"}
					</span>
					{message.questionIndex !== undefined && (
						<Badge variant="outline" className="text-xs">
							Q{message.questionIndex + 1}
						</Badge>
					)}
					{message.turnId && (
						<Badge variant="secondary" className="text-xs font-mono">
							#{message.turnId}
						</Badge>
					)}
				</div>
				<div className="whitespace-pre-wrap text-sm">{message.content}</div>
				<div className="text-xs text-muted-foreground/60 mt-1">
					{formatTime(message.timestamp)}
				</div>
			</div>
		</div>
	);
}
