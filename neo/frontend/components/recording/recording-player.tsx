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
import { SegmentsSidebar } from "@/components/recording/segments-sidebar";

interface Props {
	workspaceCode: string;
	recordingUid: string;
}

interface SegmentEvents {
	segment: Segment;
	events: eventWithTime[];
}

/**
 * Fallback dimensions used when a recording's rrweb Meta event is missing
 * or has invalid width/height. 1280×720 is the most common browser viewport
 * size, so it gives a reasonable default before the real Meta event arrives.
 */
const DEFAULT_RECORDING_WIDTH = 1280;
const DEFAULT_RECORDING_HEIGHT = 720;

export function RecordingPlayer({ workspaceCode, recordingUid }: Props) {
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
	const [controller, setController] = useState<ReplayerController | null>(null);

	const [segments, setSegments] = useState<Segment[]>([]);
	const [loadingSegments, setLoadingSegments] = useState(true);
	const [loadingEvents, setLoadingEvents] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [events, setEvents] = useState<SegmentEvents[]>([]);
	const [zoom, setZoom] = useState(0.8);
	/**
	 * Natural dimensions of the recorded page (read from the first rrweb
	 * Meta event). We render the rrweb iframe at exactly this size and then
	 * apply `transform: scale(zoom)` on top — this way the playback window
	 * itself never resizes, only the visual content scales.
	 */
	const [metaDimensions, setMetaDimensions] = useState<{
		width: number;
		height: number;
	}>({ width: DEFAULT_RECORDING_WIDTH, height: DEFAULT_RECORDING_HEIGHT });

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
				// Read the recording's intrinsic width/height from the first rrweb
				// Meta event. Every rrweb recording starts with one of these — it
				// captures the viewport size at the moment recording began. We need
				// these numbers to render the iframe at the correct size and to
				// compute the scale wrapper's dimensions.
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

	// ---- Pick a segment: seek to its first event relative to the recording baseline ----
	const playFromSegment = useCallback(
		(index: number) => {
			const data = events[index];
			if (!data || data.events.length === 0) return;
			const first = data.events[0].timestamp;
			const base = events[0]?.events[0]?.timestamp ?? first;
			const offsetMs = Math.max(0, first - base);
			setActiveIndex(index);
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
		<div className="flex gap-4 h-[calc(100vh-180px)] min-h-[600px] min-w-0">
			{/* Player card: takes 3/4 width; controller row sits at the bottom. */}
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
						/*
						 * Playback window. This is the FIXED-size area where the
						 * recording lives — it never resizes when `zoom` changes.
						 * The window scrolls (`overflow-auto`) when the scaled
						 * recording content exceeds it.
						 *
						 * Layout (three layers):
						 *   1. Viewport (this div)         — fills the card, bg + scroll
						 *   2. Scale wrapper               — sized at the visual size
						 *                                    (metaWidth × zoom)
						 *   3. rrweb container (ref)       — fixed at the recording's
						 *                                    natural dimensions; CSS
						 *                                    `transform: scale(zoom)`
						 *                                    provides the visual scale.
						 *
						 * Because the rrweb iframe is always rendered at the natural
						 * dimensions inside (3), changing zoom only changes the visual
						 * size — the iframe itself is never re-rendered or resized.
						 */
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
						</div>
					)}
				</CardContent>
				<PlayerControls
					controller={controller}
					zoom={zoom}
					onZoomChange={setZoom}
				/>
			</Card>

			{/* Segments sidebar: takes 1/4 width */}
			<SegmentsSidebar
				segments={segments}
				activeIndex={activeIndex}
				onSelect={playFromSegment}
			/>
		</div>
	);
}
