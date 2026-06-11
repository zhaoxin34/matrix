"use client";

/**
 * Recording playback component.
 *
 * Spec coverage:
 *   5.3.1 integrate @rrweb/replay Replayer
 *   5.3.2 play / pause / seek (current time / total time)
 *   5.3.3 segment list with timestamps
 *   5.3.4 start playback from a chosen segment
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Replayer } from "@rrweb/replay";
import type { eventWithTime } from "@rrweb/types";
import {
	ChevronLeft,
	ChevronRight,
	Loader2,
	Pause,
	Play,
	RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	downloadSegmentBytes,
	getErrorMessage,
	listSegments,
	type Segment,
} from "@/lib/api/recording";

interface Props {
	workspaceCode: string;
	recordingUid: string;
}

interface SegmentEvents {
	segment: Segment;
	events: eventWithTime[];
}

export function RecordingPlayer({ workspaceCode, recordingUid }: Props) {
	const replayerRef = useRef<Replayer | null>(null);
	// Use a state-backed ref so we re-render when the container div mounts
	// (refs alone don't trigger renders, and the container may not be in
	// the DOM yet when the events effect first runs).
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
	const [replayerReady, setReplayerReady] = useState(false);

	const [segments, setSegments] = useState<Segment[]>([]);
	const [loadingSegments, setLoadingSegments] = useState(true);
	const [loadingEvents, setLoadingEvents] = useState(false);
	const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [totalTime, setTotalTime] = useState(0);
	const [events, setEvents] = useState<SegmentEvents[]>([]);
	const [error, setError] = useState<string | null>(null);

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

	// ---- Download all segment events and feed Replayer ----
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

				// Compute total time from the last event timestamp (relative to first)
				const flat = all.flatMap((s) => s.events);
				if (flat.length > 0) {
					const first = flat[0].timestamp;
					const last = flat[flat.length - 1].timestamp;
					setTotalTime(Math.max(0, (last - first) / 1000));
				}
				setCurrentTime(0);
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

	// ---- Build the Replayer once both the events and the container div are ready ----
	useEffect(() => {
		if (!containerEl || events.length === 0) return;
		const flat = events.flatMap((s) => s.events);
		if (flat.length === 0) return;

		replayerRef.current?.destroy();
		let cancelled = false;
		try {
			const r = new Replayer(flat, {
				root: containerEl,
				mouseTail: false,
			});
			r.on("finish", () => setPlaying(false));
			if (cancelled) {
				r.destroy();
				return;
			}
			replayerRef.current = r;
			setReplayerReady(true);
		} catch (err) {
			console.error("[RecordingPlayer] Replayer ctor failed:", err);
		}
		return () => {
			cancelled = true;
			replayerRef.current?.destroy();
			replayerRef.current = null;
			setReplayerReady(false);
		};
	}, [containerEl, events]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			replayerRef.current?.destroy();
			replayerRef.current = null;
			setReplayerReady(false);
		};
	}, []);

	// No-op: Replayer construction moved to a dedicated effect above that
	// depends on containerEl + events so it always has the DOM node ready.

	// ---- Tick current time while playing ----
	useEffect(() => {
		if (!playing) return;
		const id = setInterval(() => {
			const t = replayerRef.current?.getCurrentTime() ?? 0;
			setCurrentTime(t / 1000); // ms → s
		}, 200);
		return () => clearInterval(id);
	}, [playing]);

	// ---- Controls ----
	const togglePlay = useCallback(() => {
		const r = replayerRef.current;
		if (!r) return;
		if (playing) {
			r.pause();
			setPlaying(false);
		} else {
			r.play();
			setPlaying(true);
		}
	}, [playing]);

	const restart = useCallback(() => {
		const r = replayerRef.current;
		if (!r) return;
		r.play(0);
		setCurrentTime(0);
		setPlaying(true);
	}, []);

	const seekTo = useCallback((offsetSec: number) => {
		const r = replayerRef.current;
		if (!r) return;
		const ms = Math.max(0, offsetSec * 1000);
		r.play(ms);
		setPlaying(true);
		setCurrentTime(offsetSec);
	}, []);

	const playFromSegment = useCallback(
		(index: number) => {
			const data = events[index];
			if (!data || data.events.length === 0) return;
			const first = data.events[0].timestamp;
			const base = events[0]?.events[0]?.timestamp ?? first;
			const offsetSec = Math.max(0, (first - base) / 1000);
			setCurrentSegmentIndex(index);
			seekTo(offsetSec);
		},
		[events, seekTo],
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
		<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
			{/* Left: player (3/4) */}
			<div className="lg:col-span-3 space-y-3">
				<Card>
					<CardContent className="p-0">
						{loadingEvents ? (
							<div className="flex flex-col items-center justify-center h-[480px] gap-3 text-muted-foreground">
								<Loader2 className="h-8 w-8 animate-spin" />
								<span className="text-sm">正在加载录像…</span>
							</div>
						) : error ? (
							<div className="flex items-center justify-center h-[480px] text-destructive text-sm">
								加载失败：{error}
							</div>
						) : (
							<div
								ref={setContainerEl}
								className="player-scroll rounded-lg bg-muted/30 w-full"
								style={{
									height: "calc(100vh - 240px)",
									minHeight: 480,
									// Set inline so Tailwind utilities can't override.
									// Both axes use `scroll` (not `auto`) so the bars
									// are always visible — on macOS the default
									// overlay style only shows on scroll, which
									// makes the horizontal overflow easy to miss.
									overflowX: "scroll",
									overflowY: "scroll",
									// Reserve layout space for the scrollbar so the
									// player content doesn't shift when bars appear.
									scrollbarGutter: "stable",
								}}
							/>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Right: control + segments (1/4) — sticky on desktop */}
			<aside className="lg:col-span-1 space-y-3 lg:sticky lg:top-6 lg:self-start">
				{/* Player controls */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							播放控制
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Big play button + time */}
						<div className="flex items-center gap-3">
							<Button
								size="lg"
								variant={playing ? "outline" : "default"}
								onClick={togglePlay}
								disabled={!replayerReady}
								className="h-12 w-12 rounded-full p-0 shrink-0"
								aria-label={playing ? "暂停" : "播放"}
							>
								{playing ? (
									<Pause className="h-5 w-5" />
								) : (
									<Play className="h-5 w-5 ml-0.5" />
								)}
							</Button>
							<div className="flex-1 min-w-0">
								<div className="font-mono text-sm tabular-nums">
									<span className="text-foreground">
										{formatTime(currentTime)}
									</span>
									<span className="text-muted-foreground"> / </span>
									<span className="text-muted-foreground">
										{formatTime(totalTime)}
									</span>
								</div>
								<input
									type="range"
									min={0}
									max={Math.max(totalTime, 1)}
									step={0.1}
									value={currentTime}
									onChange={(e) => seekTo(parseFloat(e.target.value))}
									disabled={!replayerReady}
									className="w-full h-1.5 accent-primary disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed mt-1"
								/>
							</div>
						</div>

						{/* Secondary controls */}
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="ghost"
								onClick={restart}
								disabled={!replayerReady}
								className="flex-1"
							>
								<RotateCcw className="h-3.5 w-3.5 mr-1" />
								重头播放
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Segments list */}
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Segments
							</CardTitle>
							<Badge variant="secondary" className="font-mono">
								{segments.length}
							</Badge>
						</div>
					</CardHeader>
					<CardContent>
						{segments.length === 0 ? (
							<p className="text-xs text-muted-foreground text-center py-4">
								暂无 segment
							</p>
						) : (
							<ul className="space-y-1.5">
								{segments.map((s, i) => {
									const isActive = i === currentSegmentIndex;
									const duration =
										s.end_time && s.start_time
											? Math.max(
													0,
													(new Date(s.end_time).getTime() -
														new Date(s.start_time).getTime()) /
														1000,
												)
											: 0;
									return (
										<li key={s.uid}>
											<button
												type="button"
												onClick={() => playFromSegment(i)}
												className={`group w-full text-left rounded-md border px-3 py-2 transition-colors ${
													isActive
														? "border-primary bg-primary/5 ring-1 ring-primary/30"
														: "hover:bg-muted/50 hover:border-muted-foreground/30"
												}`}
											>
												<div className="flex items-center gap-2">
													<Badge
														variant={isActive ? "default" : "outline"}
														className="font-mono shrink-0"
													>
														#{s.sequence}
													</Badge>
													<span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
														{formatTime(duration)}
													</span>
													<ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
												</div>
												{s.page_urls.length > 0 && (
													<div
														className="text-xs text-muted-foreground truncate mt-1 font-mono"
														title={s.page_urls.join("\n")}
													>
														{(() => {
															try {
																return new URL(s.page_urls[0]).pathname;
															} catch {
																return s.page_urls[0];
															}
														})()}
													</div>
												)}
												<div className="text-xs text-muted-foreground mt-0.5">
													{(s.size / 1024).toFixed(1)} KB
												</div>
											</button>
											<Link
												href={`/workspace/${workspaceCode}/recordings/${recordingUid}`}
												className="ml-1 inline-block text-xs text-muted-foreground hover:text-foreground mt-0.5"
											>
												<ChevronLeft className="h-3 w-3 inline -mt-0.5" /> 详情
											</Link>
										</li>
									);
								})}
							</ul>
						)}
					</CardContent>
				</Card>
			</aside>
		</div>
	);
}

/** Format seconds as M:SS or H:MM:SS for compact time displays. */
function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
	const total = Math.floor(seconds);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0)
		return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	return `${m}:${String(s).padStart(2, "0")}`;
}
