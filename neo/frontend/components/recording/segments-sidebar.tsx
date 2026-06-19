"use client";

/**
 * SegmentsSidebar — fixed sidebar listing the recording's segments.
 * Positioned to the right of the rrweb player in a 1/4 width column.
 *
 * Features:
 *   - Shows segment sequence, duration, and first page URL
 *   - Highlights the currently active segment
 *   - Click to jump to a segment
 */
import * as React from "react";
import { ChevronRight, List } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Segment } from "@/lib/api/recording";

export interface SegmentsSidebarProps {
  segments: Segment[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function SegmentsSidebar({
  segments,
  activeIndex,
  onSelect,
}: SegmentsSidebarProps) {
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
              return (
                <li key={s.uid}>
                  <button
                    type="button"
                    onClick={() => onSelect(i)}
                    className={cn(
                      "group w-full text-left rounded-md border px-2.5 py-2 transition-colors",
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "hover:bg-muted/50 hover:border-muted-foreground/30",
                    )}
                  >
                    <div className="flex items-center gap-2">
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
                      <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {s.page_urls.length > 0 && (
                      <div
                        className="text-[11px] text-muted-foreground truncate mt-1 font-mono"
                        title={s.page_urls.join("\n")}
                      >
                        {s.page_urls[0]}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
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
