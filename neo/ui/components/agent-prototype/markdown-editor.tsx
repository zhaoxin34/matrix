"use client";

import { useSyncExternalStore, useCallback } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

// 动态导入 Markdown 编辑器，避免 SSR 问题
const MDEditor = dynamic(
	() => import("@uiw/react-md-editor").then((mod) => mod.default),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center h-[400px] bg-muted rounded-md">
				<span className="text-sm text-muted-foreground">加载编辑器中...</span>
			</div>
		),
	},
);

// 使用 useSyncExternalStore 获取主题，避免 setState 问题
function subscribeToTheme(callback: () => void) {
	const observer = new MutationObserver(callback);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	mediaQuery.addEventListener("change", callback);

	return () => {
		observer.disconnect();
		mediaQuery.removeEventListener("change", callback);
	};
}

function getSnapshot() {
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot() {
	return "light";
}

function useColorMode() {
	return useSyncExternalStore(subscribeToTheme, getSnapshot, getServerSnapshot);
}

interface MarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	minHeight?: number;
	readOnly?: boolean;
	className?: string;
}

export function MarkdownEditor({
	value,
	onChange,
	minHeight = 400,
	readOnly = false,
	className,
}: MarkdownEditorProps) {
	const colorMode = useColorMode();

	return (
		<div
			className={cn(
				"w-full overflow-hidden rounded-md border",
				colorMode === "dark"
					? "bg-zinc-950 border-zinc-800 [&_.w-md-editor-toolbar]:bg-zinc-900 [&_.w-md-editor-preview]:bg-zinc-900 [&_.w-md-editor-preview]:text-zinc-100 [&_.w-md-editor]:bg-zinc-950 [&_.w-md-editor-toolbar]:border-zinc-800 [&_.w-md-editor]:border-zinc-800 [&_.w-md-editor-text]:bg-zinc-950 [&_.w-md-editor-text]:text-zinc-100"
					: "bg-background border-border",
				className,
			)}
			data-color-mode={colorMode}
		>
			<MDEditor
				value={value}
				onChange={(val) => onChange(val || "")}
				preview={readOnly ? "preview" : "live"}
				height={minHeight}
				style={{ minHeight }}
			/>
		</div>
	);
}

// 简化版本的 Markdown 编辑器
interface SimpleMarkdownEditorProps {
	value: string;
	onChange: (value: string) => void;
	minHeight?: number;
	className?: string;
}

export function SimpleMarkdownEditor({
	value,
	onChange,
	minHeight = 400,
	className,
}: SimpleMarkdownEditorProps) {
	const [preview, setPreview] = useState(false);
	const colorMode = useColorMode();
	const togglePreview = useCallback(() => setPreview((p) => !p), []);

	return (
		<div
			className={cn(
				"border rounded-md overflow-hidden",
				colorMode === "dark"
					? "bg-zinc-950 border-zinc-800"
					: "bg-background border-border",
				className,
			)}
		>
			{/* Toolbar */}
			<div
				className={cn(
					"flex items-center gap-1 p-2 border-b",
					colorMode === "dark"
						? "bg-zinc-900 border-zinc-800"
						: "bg-muted/50 border-border",
				)}
			>
				<button
					type="button"
					onClick={togglePreview}
					className={cn(
						"px-3 py-1 text-xs rounded transition-colors",
						colorMode === "dark"
							? "hover:bg-zinc-800 text-zinc-400"
							: "hover:bg-background text-muted-foreground",
						preview &&
							(colorMode === "dark"
								? "bg-zinc-800 text-white"
								: "bg-background text-foreground"),
					)}
				>
					编辑
				</button>
				<button
					type="button"
					onClick={togglePreview}
					className={cn(
						"px-3 py-1 text-xs rounded transition-colors",
						colorMode === "dark"
							? "hover:bg-zinc-800 text-zinc-400"
							: "hover:bg-background text-muted-foreground",
						preview &&
							(colorMode === "dark"
								? "bg-zinc-800 text-white"
								: "bg-background text-foreground"),
					)}
				>
					预览
				</button>
				<div className="flex-1" />
				<span className="text-xs text-muted-foreground font-mono">
					{value.length} 字符
				</span>
			</div>

			{/* Editor / Preview */}
			{preview ? (
				<div
					className={cn(
						"p-4 overflow-auto",
						colorMode === "dark" ? "text-zinc-100" : "",
					)}
					style={{ minHeight }}
				>
					<pre
						className={cn(
							"whitespace-pre-wrap text-sm",
							colorMode === "dark" ? "text-zinc-300" : "",
						)}
					>
						{value || "(空)"}
					</pre>
				</div>
			) : (
				<textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={cn(
						"w-full p-4 font-mono text-sm border-0 resize-y focus:outline-none",
						colorMode === "dark"
							? "bg-zinc-950 text-zinc-100 placeholder:text-zinc-500"
							: "bg-background text-foreground placeholder:text-muted-foreground",
					)}
					style={{ minHeight }}
				/>
			)}
		</div>
	);
}

// 添加 useState 的导入
import { useState } from "react";
