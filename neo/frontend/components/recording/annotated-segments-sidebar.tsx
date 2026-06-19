"use client";

/**
 * AnnotatedSegmentsSidebar — drop-in replacement for `SegmentsSidebar` that
 * supports the segment-comment annotation feature.
 *
 * Differences from the original SegmentsSidebar:
 *   - Each segment card is collapsible (▸ collapsed / ▾ expanded).
 *   - The card header shows a `[N]` badge with the comment count.
 *   - When expanded, the card reveals the comment list immediately below
 *     the segment info, sharing the same card visual boundary (per
 *     product design §7.3 — "展开嵌入" layout).
 *   - Hovering a comment row drives `onCommentHover` for canvas-overlay
 *     highlighting.
 */

import * as React from "react";
import { ChevronDown, ChevronRight, List } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Segment } from "@/lib/api/recording";
import type { SegmentComment } from "@/lib/recording/types";
import { RecordingSegmentCommentsPanel } from "./recording-segment-comments-panel";

export interface AnnotatedSegmentsSidebarProps {
  segments: Segment[];
  /** uid -> comments for that segment */
  commentsBySegment: Record<string, SegmentComment[]>;
  activeIndex: number;
  /** Expanded segment uid (or null) — single-segment accordion. */
  expandedSegmentUid: string | null;
  /** Side-panel hover drives canvas overlay highlight. */
  highlightedCommentId: string | null;
  /** Currently active comment ids (drives row highlight in the panel). */
  activeCommentIds: Set<string>;
  /** Current user id (used to gate edit/delete in the panel). */
  currentUserId: number | null;
  isWorkspaceOwner?: boolean;
  /** Called when user clicks a segment card (toggle expand + seek). */
  onSelect: (index: number) => void;
  /** Called when user toggles expand on a card (does NOT seek). */
  onToggleExpand: (segmentUid: string) => void;
  /** Open the new-comment dialog (parent owns dialog state). */
  onCreateComment: (segmentUid: string, currentTimeSec: number) => void;
  /** Open the edit-comment dialog. */
  onEditComment: (comment: SegmentComment) => void;
  /** Seek playback to this comment's show_time. */
  onJumpComment: (comment: SegmentComment) => void;
  /** Delete a single comment. */
  onDeleteComment: (comment: SegmentComment) => void;
  /** Hover / leave a comment in the panel. */
  onCommentHover: (commentUid: string | null) => void;
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

export function AnnotatedSegmentsSidebar({
  segments,
  commentsBySegment,
  activeIndex,
  expandedSegmentUid,
  highlightedCommentId,
  activeCommentIds,
  currentUserId,
  isWorkspaceOwner = false,
  onSelect,
  onToggleExpand,
  onCreateComment,
  onEditComment,
  onJumpComment,
  onDeleteComment,
  onCommentHover,
}: AnnotatedSegmentsSidebarProps) {
  return (
    <Card className="py-0 flex-1 min-h-0 overflow-hidden flex flex-col">
      <CardContent className="flex-1 p-3 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <List className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Segments
            <span className="ml-1.5 text-xs font-mono text-muted-foreground">
              {segments.length}
            </span>
          </span>
        </div>
        {segments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            暂无 segment
          </p>
        ) : (
          <ul className="space-y-1.5">
            {segments.map((s, i) => {
              const isActive = i === activeIndex;
              const isExpanded = expandedSegmentUid === s.uid;
              const segComments = commentsBySegment[s.uid] ?? [];
              return (
                <li key={s.uid}>
                  <div
                    className={cn(
                      "rounded-md border px-2.5 py-2 transition-colors",
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "hover:bg-muted/50 hover:border-muted-foreground/30",
                    )}
                  >
                    {/* Card header — clicking the body seeks to segment; clicking
                       the chevron only toggles expand. */}
                    <button
                      type="button"
                      onClick={() => onToggleExpand(s.uid)}
                      className="group w-full text-left"
                      aria-label={isExpanded ? "折叠标注" : "展开标注"}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={cn(
                            "font-mono text-xs shrink-0 inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          #{s.sequence}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
                          {formatSegDuration(s)}
                        </span>
                        {segComments.length > 0 && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            title={`${segComments.length} 条标注`}
                          >
                            [{segComments.length}]
                          </span>
                        )}
                        <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {s.page_urls.length > 0 && (
                        <div
                          className="text-[11px] text-muted-foreground truncate mt-1 font-mono pl-5"
                          title={s.page_urls.join("\n")}
                        >
                          {s.page_urls[0]}
                        </div>
                      )}
                    </button>

                    {/* Hidden helper — clicking the segment (not the chevron) seeks */}
                    <button
                      type="button"
                      onClick={() => onSelect(i)}
                      className="sr-only"
                      aria-hidden
                      tabIndex={-1}
                    />

                    {isExpanded && (
                      <RecordingSegmentCommentsPanel
                        comments={segComments}
                        segmentSequence={s.sequence}
                        highlightedId={highlightedCommentId}
                        activeIds={activeCommentIds}
                        currentUserId={currentUserId}
                        isWorkspaceOwner={isWorkspaceOwner}
                        onCreate={() =>
                          onCreateComment(s.uid, /* currentTimeSec */ 0)
                        }
                        onEdit={onEditComment}
                        onJump={onJumpComment}
                        onDelete={onDeleteComment}
                        onHover={onCommentHover}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}