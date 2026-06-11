"use client";

/**
 * FloatingSegmentsPanel — a draggable, collapsible overlay that lists the
 * recording's segments. Sits on top of the rrweb player so the user can
 * pick a segment without scrolling the main page.
 *
 * Features:
 *   - Floating: `position: fixed`, clamped to viewport bounds.
 *   - Draggable: drag from the header. Position persists in localStorage.
 *   - Collapsible: collapses to a small handle in the same position.
 *     Collapsed state persists in localStorage.
 *   - Active segment highlighted (mirrors controller time).
 *
 * The component is fully self-contained: it owns no playback state, just
 * forwards clicks to the parent's `onSelect` callback.
 */
import * as React from "react";
import { ChevronRight, GripVertical, List, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Segment } from "@/lib/api/recording";

const STORAGE_KEY = "neo.recordingPlayer.segmentsPanel";

interface PanelPosition {
	/** Distance from the right edge of the viewport, in px. */
	right: number;
	/** Distance from the bottom edge of the viewport, in px. */
	bottom: number;
}

interface PersistedState {
	position: PanelPosition;
	collapsed: boolean;
}

const DEFAULT_STATE: PersistedState = {
	position: { right: 24, bottom: 96 },
	collapsed: false,
};

const COLLAPSED_W = 44;
const EXPANDED_W = 288;

function loadState(): PersistedState {
	if (typeof window === "undefined") return DEFAULT_STATE;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_STATE;
		const parsed = JSON.parse(raw) as Partial<PersistedState>;
		return {
			position: parsed.position ?? DEFAULT_STATE.position,
			collapsed: parsed.collapsed ?? DEFAULT_STATE.collapsed,
		};
	} catch {
		return DEFAULT_STATE;
	}
}

function saveState(state: PersistedState): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore quota / private-mode errors
	}
}

export interface FloatingSegmentsPanelProps {
	segments: Segment[];
	activeIndex: number;
	onSelect: (index: number) => void;
}

export function FloatingSegmentsPanel({
	segments,
	activeIndex,
	onSelect,
}: FloatingSegmentsPanelProps) {
	// Hydration-safe: read from localStorage only on the client. Start
	// with defaults so SSR markup matches the first client render.
	const [state, setState] = React.useState<PersistedState>(DEFAULT_STATE);
	const [hydrated, setHydrated] = React.useState(false);

	React.useEffect(() => {
		setState(loadState());
		setHydrated(true);
	}, []);

	// Drag state
	const dragRef = React.useRef<{
		startX: number;
		startY: number;
		startRight: number;
		startBottom: number;
	} | null>(null);
	const [dragging, setDragging] = React.useState(false);

	const updateState = React.useCallback((patch: Partial<PersistedState>) => {
		setState((s) => {
			const next = { ...s, ...patch };
			saveState(next);
			return next;
		});
	}, []);

	const onHeaderPointerDown = React.useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			// Only initiate drag on left button.
			if (e.button !== 0) return;
			const target = e.target as HTMLElement;
			// Ignore clicks on the close button.
			if (target.closest("[data-no-drag]")) return;
			(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
			dragRef.current = {
				startX: e.clientX,
				startY: e.clientY,
				startRight: state.position.right,
				startBottom: state.position.bottom,
			};
			setDragging(true);
		},
		[state.position.right, state.position.bottom],
	);

	const onHeaderPointerMove = React.useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!dragRef.current) return;
			const dx = e.clientX - dragRef.current.startX;
			const dy = e.clientY - dragRef.current.startY;
			// Moving the mouse right increases `right` by -dx; moving down
			// increases `bottom` by -dy.
			const maxRight = Math.max(0, window.innerWidth - 80);
			const maxBottom = Math.max(0, window.innerHeight - 80);
			const newRight = Math.max(
				0,
				Math.min(maxRight, dragRef.current.startRight - dx),
			);
			const newBottom = Math.max(
				0,
				Math.min(maxBottom, dragRef.current.startBottom - dy),
			);
			setState((s) => {
				const next = {
					...s,
					position: { right: newRight, bottom: newBottom },
				};
				// Skip persistence during drag; only commit on pointerup.
				return { ...next };
			});
		},
		[],
	);

	const onHeaderPointerUp = React.useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			(e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
			if (dragRef.current) {
				dragRef.current = null;
				setDragging(false);
				saveState(state);
			}
		},
		[state],
	);

	const width = state.collapsed ? COLLAPSED_W : EXPANDED_W;
	const height = state.collapsed ? COLLAPSED_W : "auto";

	return (
		<div
			style={{
				position: "fixed",
				right: state.position.right,
				bottom: state.position.bottom,
				width,
				height: height as number | string,
				zIndex: 40,
				// Block the underlying iframe from swallowing pointer events.
				touchAction: "none",
			}}
			className={cn(
				"rounded-lg border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-lg",
				"transition-[width,height] duration-200",
				dragging ? "cursor-grabbing select-none" : "",
			)}
		>
			{/* Header: drag handle + collapse/expand */}
			<div
				onPointerDown={onHeaderPointerDown}
				onPointerMove={onHeaderPointerMove}
				onPointerUp={onHeaderPointerUp}
				onPointerCancel={onHeaderPointerUp}
				className={cn(
					"flex items-center gap-1.5 px-2 border-b select-none",
					state.collapsed
						? "h-11 justify-center border-0"
						: "h-9 justify-between",
					dragging ? "cursor-grabbing" : "cursor-grab",
				)}
			>
				{state.collapsed ? (
					<GripVertical
						className="h-4 w-4 text-muted-foreground"
						aria-label="拖动"
					/>
				) : (
					<>
						<div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
							<GripVertical className="h-3.5 w-3.5" />
							<List className="h-3.5 w-3.5" />
							<span>Segments</span>
							<span className="ml-1 font-mono text-muted-foreground/70">
								{segments.length}
							</span>
						</div>
						<button
							type="button"
							data-no-drag
							onClick={() => updateState({ collapsed: true })}
							className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
							aria-label="折叠"
							title="折叠"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					</>
				)}
			</div>

			{/* Body */}
			{!state.collapsed && (
				<div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
					{segments.length === 0 ? (
						<p className="text-xs text-muted-foreground text-center py-6">
							暂无 segment
						</p>
					) : (
						<ul className="p-1.5 space-y-1">
							{segments.map((s, i) => {
								const isActive = i === activeIndex;
								return (
									<li key={s.uid}>
										<button
											type="button"
											data-no-drag
											onClick={() => onSelect(i)}
											className={cn(
												"group w-full text-left rounded-md border px-2.5 py-1.5 transition-colors",
												isActive
													? "border-primary bg-primary/5 ring-1 ring-primary/30"
													: "hover:bg-muted/50 hover:border-muted-foreground/30",
											)}
										>
											<div className="flex items-center gap-2">
												<span
													className={cn(
														"font-mono text-[10px] shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded",
														isActive
															? "bg-primary text-primary-foreground"
															: "bg-muted text-muted-foreground",
													)}
												>
													#{s.sequence}
												</span>
												<span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
													{formatSegDuration(s)}
												</span>
												<ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
											</div>
											{s.page_urls.length > 0 && (
												<div
													className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono"
													title={s.page_urls.join("\n")}
												>
													{pathnameOf(s.page_urls[0])}
												</div>
											)}
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}

			{/* Expand button when collapsed */}
			{state.collapsed && (
				<button
					type="button"
					data-no-drag
					onClick={() => updateState({ collapsed: false })}
					className="absolute inset-0 -top-11 flex flex-col items-center justify-center gap-0.5"
					aria-label="展开 Segments"
					title="展开"
				>
					<List className="h-4 w-4 text-foreground" />
					<span className="text-[10px] font-mono text-muted-foreground">
						{segments.length}
					</span>
				</button>
			)}

			{/* Suppress unused-var warning in SSR (hydrated is read for the
			    effect, but not used in render; ESLint sometimes complains). */}
			{hydrated ? null : null}
		</div>
	);
}

function formatSegDuration(s: Segment): string {
	if (!s.end_time || !s.start_time) return "—";
	const sec =
		(new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 1000;
	if (!Number.isFinite(sec) || sec < 0) return "—";
	const m = Math.floor(sec / 60);
	const rem = Math.floor(sec % 60);
	return `${m}:${String(rem).padStart(2, "0")}`;
}

function pathnameOf(url: string): string {
	try {
		return new URL(url).pathname;
	} catch {
		return url;
	}
}
