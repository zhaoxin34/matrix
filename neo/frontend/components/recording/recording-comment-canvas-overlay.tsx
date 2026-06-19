/**
 * RecordingCommentCanvasOverlay — stacked bubble cards overlaid on the
 * playback canvas. Renders the comments that are currently active
 * (currentTime in [show_time, hide_time]).
 *
 * Position: top-right of the canvas, with an N/M counter and chevron
 * controls when more than one comment is active. Hovered comments from
 * the side panel get a highlight ring even if they're not currently
 * active.
 *
 * Click outside the bubble to dismiss; clicking the close button does the
 * same. The component does not own dismissal state — it stays mounted
 * whenever there are active comments.
 */

"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCreatorColor } from "@/lib/recording/comment-color";
import type { SegmentComment } from "@/lib/recording/types";

export interface RecordingCommentCanvasOverlayProps {
	/** Active comments (already filtered by currentTime). */
	activeComments: SegmentComment[];
	/** Highlighted comment (side-panel hover) — drawn with extra ring even if inactive. */
	highlightedId: string | null;
	/** Index the user is currently focused on (controlled). */
	focusedIndex: number;
	/** Notify when the user navigates between stacked comments. */
	onFocusChange: (idx: number) => void;
	/** Called when the user wants to dismiss the overlay. */
	onDismiss: () => void;
}

export function RecordingCommentCanvasOverlay({
	activeComments,
	highlightedId,
	focusedIndex,
	onFocusChange,
	onDismiss,
}: RecordingCommentCanvasOverlayProps) {
	// No active comments: optionally render the highlighted-only "ping".
	// We keep the overlay mounted only when there's at least one comment to draw.
	if (activeComments.length === 0) return null;

	const safeIdx = Math.max(
		0,
		Math.min(focusedIndex, activeComments.length - 1),
	);
	const focus = activeComments[safeIdx];

	return (
		<div
			className="pointer-events-none absolute top-3 right-3 z-10 w-80 max-w-[calc(100%-1.5rem)]"
			role="region"
			aria-label="注释气泡"
		>
			<div className="pointer-events-auto rounded-lg border bg-card/95 backdrop-blur shadow-md overflow-hidden">
				{/* Header */}
				<div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30">
					<span className="text-xs font-medium">当前时段标注</span>
					{activeComments.length > 1 && (
						<span className="text-[11px] font-mono text-muted-foreground ml-1">
							{safeIdx + 1}/{activeComments.length}
						</span>
					)}
					<div className="ml-auto flex items-center gap-1">
						{activeComments.length > 1 && (
							<>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() =>
										onFocusChange(
											(safeIdx - 1 + activeComments.length) %
												activeComments.length,
										)
									}
									title="上一个"
								>
									<ChevronLeft className="h-3.5 w-3.5" />
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() =>
										onFocusChange((safeIdx + 1) % activeComments.length)
									}
									title="下一个"
								>
									<ChevronRight className="h-3.5 w-3.5" />
								</Button>
							</>
						)}
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={onDismiss}
							title="关闭"
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>

				{/* Body — focused bubble */}
				<BubbleBody
					comment={focus}
					isHighlighted={focus.uid === highlightedId}
				/>
			</div>
		</div>
	);
}

interface BubbleBodyProps {
	comment: SegmentComment;
	isHighlighted: boolean;
}

function BubbleBody({ comment, isHighlighted }: BubbleBodyProps) {
	const [expanded, setExpanded] = React.useState(false);
	const hasContent = !!comment.content && comment.content.trim().length > 0;
	const color = getCreatorColor(comment.creator.id);
	return (
		<div className={cn("px-3 py-2", isHighlighted && "ring-2 ring-primary/40")}>
			<div className="flex items-center gap-2 text-xs text-muted-foreground">
				<span
					className="inline-block w-2 h-2 rounded-full shrink-0"
					style={{ backgroundColor: color }}
					aria-hidden
				/>
				<span className="font-medium">{comment.creator.name}</span>
				<span className="ml-auto font-mono tabular-nums">
					{comment.show_time.toFixed(1)}s ─ {comment.hide_time.toFixed(1)}s
				</span>
			</div>
			<div className="text-sm mt-1">{comment.abstract}</div>
			{hasContent && (
				<div className="mt-1">
					{expanded ? (
						<p className="text-xs whitespace-pre-wrap text-muted-foreground">
							{comment.content}
						</p>
					) : null}
					<button
						type="button"
						className="text-[11px] text-primary mt-0.5 hover:underline"
						onClick={() => setExpanded((v) => !v)}
					>
						{expanded ? "收起" : "详情 ▾"}
					</button>
				</div>
			)}
		</div>
	);
}
