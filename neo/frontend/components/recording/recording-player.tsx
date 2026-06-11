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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Replayer } from "@rrweb/replay";
import type { eventWithTime } from "@rrweb/types";
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
	const containerRef = useRef<HTMLDivElement>(null);
	const replayerRef = useRef<Replayer | null>(null);

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

				// Flatten and feed to Replayer
				const flat = all.flatMap((s) => s.events);
				if (containerRef.current && flat.length > 0) {
					replayerRef.current?.destroy();
					const r = new Replayer(flat, {
						root: containerRef.current,
					});
					r.on("finish", () => setPlaying(false));
					replayerRef.current = r;
					// Compute total time from the last event timestamp (relative to first)
					if (flat.length > 0) {
						const first = flat[0].timestamp;
						const last = flat[flat.length - 1].timestamp;
						setTotalTime(Math.max(0, (last - first) / 1000));
					}
					setCurrentTime(0);
				}
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

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			replayerRef.current?.destroy();
			replayerRef.current = null;
		};
	}, []);

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

	const totalSegmentsLabel = useMemo(
		() => `共 ${segments.length} 个 segment`,
		[segments.length],
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
		<div className="space-y-4">
			{/* Replayer container */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base flex items-center justify-between">
						<span>回放</span>
						<span className="text-xs text-muted-foreground font-normal">
							{totalSegmentsLabel}
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{loadingEvents ? (
						<div className="flex items-center justify-center h-96">
							<Skeleton className="h-32 w-1/2" />
						</div>
					) : error ? (
						<div className="text-destructive text-sm py-6">
							加载失败：{error}
						</div>
					) : (
						<>
							<div
								ref={containerRef}
								className="border rounded overflow-hidden bg-muted/30"
								style={{ minHeight: 480 }}
							/>

							{/* Control bar */}
							<div className="mt-3 flex items-center gap-3">
								<Button
									size="sm"
									variant={playing ? "outline" : "default"}
									onClick={togglePlay}
									disabled={!replayerRef.current}
								>
									{playing ? "暂停" : "播放"}
								</Button>
								<div className="flex-1">
									<input
										type="range"
										min={0}
										max={Math.max(totalTime, 1)}
										step={0.1}
										value={currentTime}
										onChange={(e) => seekTo(parseFloat(e.target.value))}
										className="w-full"
									/>
								</div>
								<span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
									{currentTime.toFixed(1)}s / {totalTime.toFixed(1)}s
								</span>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Segment list */}
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Segments</CardTitle>
				</CardHeader>
				<CardContent>
					<ul className="space-y-1">
						{segments.map((s, i) => (
							<li
								key={s.uid}
								className={`flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-muted/50 ${
									i === currentSegmentIndex ? "bg-muted" : ""
								}`}
								onClick={() => playFromSegment(i)}
							>
								<Badge variant="outline" className="font-mono">
									#{s.sequence}
								</Badge>
								<div className="flex-1 min-w-0">
									<div className="text-sm">
										{s.start_time
											? new Date(s.start_time).toLocaleString()
											: "—"}
										{" → "}
										{s.end_time ? new Date(s.end_time).toLocaleString() : "—"}
									</div>
									<div className="text-xs text-muted-foreground">
										{s.page_urls.length} 个页面 · {(s.size / 1024).toFixed(1)}{" "}
										KB
									</div>
								</div>
								<Button
									asChild
									size="sm"
									variant="ghost"
									onClick={(e) => e.stopPropagation()}
								>
									<Link
										href={`/workspace/${workspaceCode}/recordings/${recordingUid}`}
									>
										详情
									</Link>
								</Button>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
