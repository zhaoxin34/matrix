/**
 * RecordingSegmentCommentsPanel — comment list embedded inside an expanded
 * segment card in the side panel.
 *
 * Visual hierarchy (mirrors product design §7.3):
 *
 *   ── 标注 (N)  [+ 标注] ─────────────────
 *   👤 张三 · 14:23    00:12 ─ 00:20
 *   为什么选这群人?              [active]
 *   ▶跳转  ✏编辑  🗑删除
 *   ─────────────────────────────────────
 *   👤 李四 · 14:25    00:34 ─ 00:40
 *   ...
 *
 * Behavior:
 *   - Each comment row exposes jump / edit / delete actions.
 *   - The creator-or-owner rule is enforced server-side; the panel hides
 *     edit/delete for items where `creator.id !== currentUserId` (the
 *     workspace-Owner override is the user's choice at the API level).
 *   - Hovering a row sets `highlightedId` so the canvas overlay can match.
 */

"use client";

import * as React from "react";
import { MessageSquarePlus, Pencil, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCreatorColor } from "@/lib/recording/comment-color";
import type { SegmentComment } from "@/lib/recording/types";

export interface RecordingSegmentCommentsPanelProps {
	comments: SegmentComment[];
	/** Segment label for the dialog title (e.g. "segment #1"). */
	segmentSequence: number;
	/** Highlighted comment uid (driven by side-panel hover). */
	highlightedId: string | null;
	/** Currently active comment uids (currentTime within range). */
	activeIds: Set<string>;
	/** Current user id (used to gate edit/delete). */
	currentUserId: number | null;
	/** Workspace role of the current user; if OWNER, edit/delete are always shown. */
	isWorkspaceOwner?: boolean;
	/** Open the new-comment dialog. */
	onCreate: () => void;
	/** Open the edit-comment dialog. */
	onEdit: (comment: SegmentComment) => void;
	/** Seek playback to this comment's show_time. */
	onJump: (comment: SegmentComment) => void;
	/** Delete a single comment (caller wires to confirmation dialog). */
	onDelete: (comment: SegmentComment) => void;
	/** Set / clear hover highlight. */
	onHover: (commentUid: string | null) => void;
}

function formatTimeRange(s: number, e: number): string {
	return `${s.toFixed(2)}s ─ ${e.toFixed(2)}s`;
}

export function RecordingSegmentCommentsPanel({
	comments,
	highlightedId,
	activeIds,
	currentUserId,
	isWorkspaceOwner = false,
	onCreate,
	onEdit,
	onJump,
	onDelete,
	onHover,
}: RecordingSegmentCommentsPanelProps) {
	return (
		<div className="border-t pt-2 mt-2 space-y-1.5">
			{/* Header */}
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
					<span>标注</span>
					<span className="font-mono">({comments.length})</span>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-6 px-2 text-xs"
					onClick={onCreate}
				>
					<MessageSquarePlus className="h-3 w-3 mr-1" />
					新建
				</Button>
			</div>

			{/* Empty state */}
			{comments.length === 0 && (
				<p className="text-xs text-muted-foreground text-center py-3">
					该片段暂无标注
				</p>
			)}

			{/* Comment rows */}
			{comments.map((c) => {
				const isActive = activeIds.has(c.uid);
				const isHighlighted = highlightedId === c.uid;
				const canEditOrDelete =
					isWorkspaceOwner ||
					(currentUserId !== null && c.creator.id === currentUserId);
				const color = getCreatorColor(c.creator.id);
				return (
					<div
						key={c.uid}
						onMouseEnter={() => onHover(c.uid)}
						onMouseLeave={() => onHover(null)}
						className={cn(
							"rounded-md border px-2 py-1.5 transition-colors",
							isActive
								? "border-primary bg-primary/5"
								: "border-transparent hover:bg-muted/40",
							isHighlighted && !isActive && "ring-1 ring-primary/30",
						)}
					>
						<div className="flex items-center gap-2 text-[11px] text-muted-foreground">
							<span
								className="inline-block w-2 h-2 rounded-full shrink-0"
								style={{ backgroundColor: color }}
								aria-hidden
							/>
							<span className="font-medium">{c.creator.name}</span>
							<span className="ml-auto font-mono tabular-nums">
								{formatTimeRange(c.show_time, c.hide_time)}
							</span>
							{isActive && (
								<span className="text-[10px] font-medium text-primary">
									active
								</span>
							)}
						</div>
						<div className="text-sm mt-0.5 line-clamp-2">{c.abstract}</div>
						<div className="flex items-center gap-1 mt-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-6 px-1.5 text-xs"
								onClick={() => onJump(c)}
								title="跳转"
							>
								<Play className="h-3 w-3 mr-0.5" />
								跳转
							</Button>
							{canEditOrDelete && (
								<>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-6 px-1.5 text-xs"
										onClick={() => onEdit(c)}
										title="编辑"
									>
										<Pencil className="h-3 w-3" />
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-6 px-1.5 text-xs text-destructive hover:text-destructive"
										onClick={() => onDelete(c)}
										title="删除"
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								</>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
