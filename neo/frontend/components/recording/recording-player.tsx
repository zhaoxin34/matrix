"use client";
/**
 * Recording playback component — annotated version.
 *
 * Spec coverage (recording-playback):
 *   5.3.1 integrate @rrweb/replay Replayer
 *   5.3.2 play / pause / seek (current time / total time)
 *   5.3.3 segment list with timestamps
 *   5.3.4 start playback from a chosen segment
 *
 * Spec coverage (recording-segment-comment):
 *   - Load all comments for the recording on mount
 *   - Segment cards collapsible with [N] badge
 *   - Expanded card embeds the comment list (segment-relative layout)
 *   - Canvas overlay renders active comments stacked
 *   - Progress bar overlays colored range markers
 *   - Side-panel hover ↔ canvas bubble highlight
 *   - Jump / edit / delete actions per comment
 *   - [ + 标注 ] button in the bottom control bar
 *
 * The component is the single integration point for the playback page.
 * It composes the existing ReplayerController, AnnotatedSegmentsSidebar,
 * recordingcommentcanvasoverlay, RecordingCommentTimelineMarkers, and
 * RecordingCommentDialog into one flow.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EventType, type eventWithTime } from "@rrweb/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	downloadSegmentBytes,
	getErrorMessage,
	listSegments,
	type Segment,
} from "@/lib/api/recording";
import { ReplayerController } from "@/lib/recording/replayer-controller";
import { PlayerControls } from "@/components/recording/player-controls";
import { AnnotatedSegmentsSidebar } from "@/components/recording/annotated-segments-sidebar";
import { RecordingCommentCanvasOverlay } from "@/components/recording/recording-comment-canvas-overlay";
import { RecordingCommentDialog } from "@/components/recording/recording-comment-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSegmentComments } from "@/hooks/use-segment-comments";
import type { SegmentComment } from "@/lib/recording/types";

interface Props {
	workspaceCode: string;
	recordingUid: string;
	/** Current user id; falls back to null when not yet known. */
	currentUserId?: number | null;
	/** Whether the current user is the workspace Owner. */
	isWorkspaceOwner?: boolean;
}

interface SegmentEvents {
	segment: Segment;
	events: eventWithTime[];
}

const DEFAULT_RECORDING_WIDTH = 1280;
const DEFAULT_RECORDING_HEIGHT = 720;

export function RecordingPlayer({
	workspaceCode,
	recordingUid,
	currentUserId = null,
	isWorkspaceOwner = false,
}: Props) {
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
	const [controller, setController] = useState<ReplayerController | null>(null);

	const [segments, setSegments] = useState<Segment[]>([]);
	const [loadingSegments, setLoadingSegments] = useState(true);
	const [loadingEvents, setLoadingEvents] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [events, setEvents] = useState<SegmentEvents[]>([]);
	const [zoom, setZoom] = useState(0.8);
	const [metaDimensions, setMetaDimensions] = useState<{
		width: number;
		height: number;
	}>({ width: DEFAULT_RECORDING_WIDTH, height: DEFAULT_RECORDING_HEIGHT });

	// Annotation state — from the dedicated hook.
	const comments = useSegmentComments(
		workspaceCode,
		recordingUid,
		currentUserId,
	);
	const {
		bySegment,
		activeIds,
		highlightedId,
		dialog,
		setActiveSegment,
		setHighlighted,
		openCreateDialog,
		openEditDialog,
		closeDialog,
		submitDialog,
		removeComment,
	} = comments;

	const [expandedSegmentUid, setExpandedSegmentUid] = useState<string | null>(
		null,
	);
	const [deleteTarget, setDeleteTarget] = useState<SegmentComment | null>(null);
	const [dialogSaving, setDialogSaving] = useState(false);
	const [canvasFocusIndex, setCanvasFocusIndex] = useState(0);
	const [overlayDismissed, setOverlayDismissed] = useState(false);

	// ---- Track current playback time + active segment for comments ----
	// ReplayerController.getCurrentTime() returns the absolute time across
	// all segments. We derive per-segment elapsed time from it.
	const lastSegmentStartRef = useRef<number>(0);

	// ---- Load segment metadata ----
	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoadingSegments(true);
			try {
				const list = await listSegments(workspaceCode, recordingUid);
				if (cancelled) return;
				setSegments(list);
			} catch (err) {
				if (cancelled) return;
				toast.error(`加载 segments 失败：${getErrorMessage(err)}`);
			} finally {
				if (!cancelled) setLoadingSegments(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [workspaceCode, recordingUid]);

	// ---- Download all segment events ----
	useEffect(() => {
		if (segments.length === 0) return;
		let cancelled = false;
		(async () => {
			setLoadingEvents(true);
			setError(null);
			try {
				const all: SegmentEvents[] = [];
				for (const seg of segments) {
					const text = await downloadSegmentBytes(
						workspaceCode,
						recordingUid,
						seg.uid,
					);
					let parsed: eventWithTime[];
					try {
						parsed = JSON.parse(text) as eventWithTime[];
					} catch {
						throw new Error(`segment ${seg.uid} 内容不是合法 JSON`);
					}
					all.push({ segment: seg, events: parsed });
				}
				if (cancelled) return;
				setEvents(all);
				let dims = {
					width: DEFAULT_RECORDING_WIDTH,
					height: DEFAULT_RECORDING_HEIGHT,
				};
				outer: for (const seg of all) {
					for (const ev of seg.events) {
						if (ev.type === EventType.Meta) {
							const data = ev.data as { width?: number; height?: number };
							if (
								typeof data.width === "number" &&
								typeof data.height === "number" &&
								data.width > 0 &&
								data.height > 0
							) {
								dims = { width: data.width, height: data.height };
								break outer;
							}
						}
					}
				}
				setMetaDimensions(dims);
			} catch (err) {
				if (cancelled) return;
				const msg = getErrorMessage(err);
				setError(msg);
				toast.error(`加载录制数据失败：${msg}`);
			} finally {
				if (!cancelled) setLoadingEvents(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [segments, workspaceCode, recordingUid]);

	// ---- Build the ReplayerController once both events and the container are ready ----
	useEffect(() => {
		if (!containerEl || events.length === 0) return;
		const flat = events.flatMap((s) => s.events);
		if (flat.length === 0) return;

		const c = new ReplayerController({
			container: containerEl,
			events: flat,
		});
		setController(c);
		return () => {
			c.destroy();
			setController(null);
		};
	}, [containerEl, events, metaDimensions]);

	// ---- Track current playback time → drive comments.activeIds ----
	useEffect(() => {
		if (!controller || events.length === 0) return;

		const off = controller.on("timeupdate", () => {
			const totalMs = controller.getCurrentTime();
			// Find which segment contains the current time.
			// We assume events[].events are time-ordered within a recording.
			let segIdx = 0;
			let segElapsedMs = totalMs;
			let accumulated = 0;
			for (let i = 0; i < events.length; i++) {
				const segStart = events[i].events[0]?.timestamp ?? 0;
				const segEnd =
					events[i].events[events[i].events.length - 1]?.timestamp ?? segStart;
				if (totalMs + segStart >= segStart && totalMs + segStart <= segEnd) {
					segIdx = i;
					segElapsedMs = totalMs; // controller time is per-segment elapsed
					accumulated = segStart;
					break;
				}
				// Fallback: cumulative
				const dur = segEnd - segStart;
				if (totalMs <= accumulated + dur) {
					segIdx = i;
					segElapsedMs = totalMs - accumulated;
					break;
				}
				accumulated += dur;
			}
			const activeSeg = events[segIdx]?.segment;
			if (activeSeg) {
				// Update activeIndex for sidebar highlight
				const idx = segments.findIndex((s) => s.uid === activeSeg.uid);
				if (idx >= 0 && idx !== activeIndex) setActiveIndex(idx);
				setActiveSegment(activeSeg.uid, segElapsedMs / 1000);
				lastSegmentStartRef.current = segElapsedMs;
			}
		});

		return () => off();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [controller, events, segments]);

	// ---- Pick a segment: seek to its first event ----
	//
	// Optional `seekOffsetMs` lets callers (e.g. handleJumpComment) seek
	// to a position *within* the segment rather than to the segment start.
	// The combined offset is then seeked atomically in one call (rrweb's
	// seek implementation uses pause(time) which internally does
	// play(time) + immediate pause — guaranteeing the replayer parks at
	// the target even if it was already paused).
	const playFromSegment = useCallback(
		(index: number, seekOffsetMs = 0) => {
			const data = events[index];
			if (!data || data.events.length === 0) return;
			const first = data.events[0].timestamp;
			const base = events[0]?.events[0]?.timestamp ?? first;
			const offsetMs = Math.max(0, first - base) + Math.max(0, seekOffsetMs);
			setActiveIndex(index);
			setOverlayDismissed(false);
			controller?.seek(offsetMs);
		},
		[events, controller],
	);

	// ---- Comment dialog handlers ----
	const handleOpenCreate = useCallback(() => {
		const seg = segments[activeIndex];
		if (!seg) return;
		controller?.pause();
		// currentTimeSec is in segment-relative seconds; we don't have it
		// directly here without the controller, so default to 0 (the user
		// can edit in the dialog).
		openCreateDialog(seg.uid, 0);
	}, [segments, activeIndex, controller, openCreateDialog]);

	const handleOpenEdit = useCallback(
		(comment: SegmentComment) => {
			controller?.pause();
			openEditDialog(comment);
		},
		[controller, openEditDialog],
	);

	const handleDialogSubmit = useCallback(
		async (input: {
			show_time: number;
			hide_time: number;
			abstract: string;
			content: string | null;
		}) => {
			setDialogSaving(true);
			try {
				await submitDialog(input);
			} catch (err) {
				toast.error(`保存标注失败：${getErrorMessage(err)}`);
			} finally {
				setDialogSaving(false);
			}
		},
		[submitDialog],
	);

	const handleDeleteConfirm = useCallback(async () => {
		if (!deleteTarget) return;
		try {
			await removeComment(deleteTarget.uid);
			toast.success("标注已删除");
		} catch (err) {
			toast.error(`删除标注失败：${getErrorMessage(err)}`);
		} finally {
			setDeleteTarget(null);
		}
	}, [deleteTarget, removeComment]);

	const handleJumpComment = useCallback(
		(comment: SegmentComment) => {
			const idx = segments.findIndex((s) => s.uid === comment.segment_uid);
			if (idx < 0) return;
			// Single atomic seek: jump straight to (segment start + show_time)
			// and immediately start playback. No RAF, no double-seek.
			playFromSegment(idx, comment.show_time * 1000);
			controller?.play();
		},
		[segments, controller, playFromSegment],
	);

	const handleToggleExpand = useCallback((segmentUid: string) => {
		setExpandedSegmentUid((cur) => (cur === segmentUid ? null : segmentUid));
	}, []);

	// Active comments for the canvas overlay.
	const activeComments = useMemo(() => {
		const seg = segments[activeIndex];
		if (!seg) return [];
		return bySegment[seg.uid]?.filter((c) => activeIds.has(c.uid)) ?? [];
	}, [segments, activeIndex, bySegment, activeIds]);

	// Reset overlay dismissal when active set changes (a new active range starts).
	useEffect(() => {
		if (activeComments.length > 0) setOverlayDismissed(false);
	}, [activeComments.length, activeComments[0]?.uid]);

	if (loadingSegments) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-1/2" />
				<Skeleton className="h-96" />
				<Skeleton className="h-32" />
			</div>
		);
	}

	if (segments.length === 0) {
		return (
			<Card>
				<CardContent className="py-10 text-center text-muted-foreground">
					该录像暂无 segment，无法回放
				</CardContent>
			</Card>
		);
	}

	const dialogSegment = dialog
		? segments.find((s) => s.uid === dialog.segmentUid)
		: null;
	const dialogEditing =
		dialog?.mode === "edit" && dialog.commentUid
			? dialogSegment
				? bySegment[dialog.segmentUid]?.find((c) => c.uid === dialog.commentUid)
				: null
			: null;

	return (
		<div className="flex gap-4 h-[calc(100vh-180px)] min-h-[600px] min-w-0">
			<Card className="py-0 flex-[3] flex flex-col min-h-0 overflow-hidden">
				<CardContent className="relative flex-1 p-0 min-h-0 overflow-hidden">
					{loadingEvents ? (
						<div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
							<Loader2 className="h-8 w-8 animate-spin" />
							<span className="text-sm">正在加载录像…</span>
						</div>
					) : error ? (
						<div className="flex items-center justify-center h-full text-destructive text-sm">
							加载失败：{error}
						</div>
					) : (
						<div
							className="absolute inset-0 player-scroll bg-muted/30 overflow-auto flex"
							style={{
								alignItems: "safe center",
								justifyContent: "safe center",
							}}
						>
							<div
								style={{
									width: metaDimensions.width * zoom,
									height: metaDimensions.height * zoom,
									flexShrink: 0,
								}}
							>
								<div
									ref={setContainerEl}
									style={{
										width: metaDimensions.width,
										height: metaDimensions.height,
										transform: `scale(${zoom})`,
										transformOrigin: "top left",
									}}
								/>
							</div>
							{/* Canvas overlay — active comments only when not dismissed. */}
							{activeComments.length > 0 && !overlayDismissed && (
								<RecordingCommentCanvasOverlay
									activeComments={activeComments}
									highlightedId={highlightedId}
									focusedIndex={canvasFocusIndex}
									onFocusChange={setCanvasFocusIndex}
									onDismiss={() => setOverlayDismissed(true)}
								/>
							)}
						</div>
					)}
				</CardContent>
				<PlayerControls
					controller={controller}
					zoom={zoom}
					onZoomChange={setZoom}
					onAddComment={handleOpenCreate}
					addCommentDisabled={loadingEvents || !!error}
					comments={bySegment[segments[activeIndex]?.uid ?? ""] ?? []}
					segmentDurationSec={(() => {
						const cur = segments[activeIndex];
						if (!cur || !cur.start_time || !cur.end_time) return undefined;
						return (
							(new Date(cur.end_time).getTime() -
								new Date(cur.start_time).getTime()) /
							1000
						);
					})()}
					onMarkerClick={(c) => handleJumpComment(c)}
				/>
			</Card>

			<AnnotatedSegmentsSidebar
				segments={segments}
				commentsBySegment={bySegment}
				activeIndex={activeIndex}
				expandedSegmentUid={expandedSegmentUid}
				highlightedCommentId={highlightedId}
				activeCommentIds={activeIds}
				currentUserId={currentUserId}
				isWorkspaceOwner={isWorkspaceOwner}
				onSelect={playFromSegment}
				onToggleExpand={handleToggleExpand}
				onCreateComment={(segmentUid, currentTimeSec) =>
					openCreateDialog(segmentUid, currentTimeSec)
				}
				onEditComment={handleOpenEdit}
				onJumpComment={handleJumpComment}
				onDeleteComment={setDeleteTarget}
				onCommentHover={setHighlighted}
			/>

			{/* Dialog */}
			<RecordingCommentDialog
				open={!!dialog}
				mode={dialog?.mode ?? "create"}
				segmentLabel={`segment`}
				segmentSequence={dialogSegment?.sequence ?? 0}
				defaultShowTime={dialog?.defaultShowTime ?? 0}
				defaultHideTime={dialog?.defaultHideTime ?? 15}
				initialAbstract={dialogEditing?.abstract ?? ""}
				initialContent={dialogEditing?.content ?? null}
				canDelete={
					isWorkspaceOwner ||
					(dialogEditing !== null &&
						dialogEditing !== undefined &&
						currentUserId !== null &&
						dialogEditing.creator.id === currentUserId)
				}
				saving={dialogSaving}
				onSave={handleDialogSubmit}
				onDelete={() => {
					if (dialogEditing) setDeleteTarget(dialogEditing);
				}}
				onCancel={closeDialog}
			/>

			{/* Delete confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(o) => !o && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>确定删除此标注吗？</AlertDialogTitle>
						<AlertDialogDescription>
							将删除标注「{deleteTarget?.abstract ?? ""}」。此操作不可撤销。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>取消</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm}>
							删除
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
