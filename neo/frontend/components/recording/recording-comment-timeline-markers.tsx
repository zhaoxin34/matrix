/**
 * RecordingCommentTimelineMarkers — colored range markers overlaid on the
 * rrweb-player progress bar.
 *
 * Layout:
 *   - One absolute-positioned div per comment, anchored above the
 *     progress bar (rendered by `PlayerControls`).
 *   - Each marker's width is proportional to (hide_time - show_time)
 *     relative to the segment duration.
 *   - The marker color comes from `getCreatorColor(creator.id)` so the
 *     same user always gets the same hue.
 *
 * Interaction:
 *   - `pointer-events: none` so we don't block the underlying slider.
 *   - Tooltip via `title=` on hover shows the abstract.
 */

"use client";

import * as React from "react";

import { getCreatorColor } from "@/lib/recording/comment-color";
import type { SegmentComment } from "@/lib/recording/types";

export interface RecordingCommentTimelineMarkersProps {
	comments: SegmentComment[];
	/** Total duration of the current segment in seconds. */
	segmentDurationSec: number;
	/** Optional click callback — useful for "click marker to jump". */
	onMarkerClick?: (comment: SegmentComment) => void;
}

export function RecordingCommentTimelineMarkers({
	comments,
	segmentDurationSec,
	onMarkerClick,
}: RecordingCommentTimelineMarkersProps) {
	if (!segmentDurationSec || segmentDurationSec <= 0) return null;
	return (
		<div
			className="pointer-events-none absolute left-0 right-0 top-0 h-1.5"
			aria-hidden
		>
			{comments.map((c) => {
				const leftPct = Math.max(0, (c.show_time / segmentDurationSec) * 100);
				const widthPct = Math.max(
					0.5,
					((c.hide_time - c.show_time) / segmentDurationSec) * 100,
				);
				const color = getCreatorColor(c.creator.id);
				return (
					<div
						key={c.uid}
						className="absolute h-full rounded-sm"
						style={{
							left: `${leftPct}%`,
							width: `${widthPct}%`,
							backgroundColor: color,
							opacity: 0.75,
							cursor: onMarkerClick ? "pointer" : undefined,
							pointerEvents: onMarkerClick ? "auto" : "none",
						}}
						title={`${c.creator.name}: ${c.abstract}`}
						onClick={onMarkerClick ? () => onMarkerClick(c) : undefined}
					/>
				);
			})}
		</div>
	);
}
