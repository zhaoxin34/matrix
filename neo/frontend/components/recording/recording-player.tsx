"use client";

/**
 * Recording playback component.
 *
 * Spec coverage:
 *   5.3.1 integrate @rrweb/replay Replayer
 *   5.3.2 play / pause / seek (current time / total time)
 *   5.3.3 segment list with timestamps
 *   5.3.4 start playback from a chosen segment
 *
 * Architecture (B): we use a thin `ReplayerController` to wrap the rrweb
 * Replayer. The bottom control bar is a separate presentational component
 * that subscribes to controller events. The Replayer is owned by this
 * component so we can swap it when the user picks a different segment.
 */

import { useCallback, useEffect, useState } from "react";
import type { eventWithTime } from "@rrweb/types";
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
import { FloatingSegmentsPanel } from "@/components/recording/floating-segments-panel";

interface Props {
	workspaceCode: string;
	recordingUid: string;
}

interface SegmentEvents {
	segment: Segment;
	events: eventWithTime[];
}

export function RecordingPlayer({ workspaceCode, recordingUid }: Props) {
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
	const [controller, setController] = useState<ReplayerController | null>(null);

	const [segments, setSegments] = useState<Segment[]>([]);
	const [loadingSegments, setLoadingSegments] = useState(true);
	const [loadingEvents, setLoadingEvents] = useState(false);
	const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [events, setEvents] = useState<SegmentEvents[]>([]);

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
	}, [containerEl, events]);

	// ---- Pick a segment: seek to its first event relative to the recording baseline ----
	const playFromSegment = useCallback(
		(index: number) => {
			const data = events[index];
			if (!data || data.events.length === 0) return;
			const first = data.events[0].timestamp;
			const base = events[0]?.events[0]?.timestamp ?? first;
			const offsetMs = Math.max(0, first - base);
			setCurrentSegmentIndex(index);
			controller?.pause();
			controller?.seek(offsetMs);
		},
		[events, controller],
	);

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

	return (
		<div className="flex flex-col gap-4 h-[calc(100vh-180px)] min-h-[600px] min-w-0">
			{/* Player card: takes all available height; controller row sits at the bottom. */}
			<Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
				<CardContent className="flex-1 p-0 min-h-0 relative">
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
							ref={setContainerEl}
							className="player-scroll bg-muted/30 w-full h-full"
							style={{
								// Always-on bars so the user can tell the iframe is
								// scrollable, and the content doesn't reflow.
								overflowX: "scroll",
								overflowY: "scroll",
								scrollbarGutter: "stable",
							}}
						/>
					)}
				</CardContent>
				<PlayerControls controller={controller} />
			</Card>

			{/* Segments: floating, draggable, collapsible panel.
			    Position + collapsed state persist in localStorage. */}
			<FloatingSegmentsPanel
				segments={segments}
				activeIndex={currentSegmentIndex}
				onSelect={playFromSegment}
			/>
		</div>
	);
}
