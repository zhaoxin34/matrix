"use client";

/**
 * AgentSteerPanel — UI for the Agent Steer recording side-panel.
 *
 * Intentionally minimal: start/stop, status, segment count, page URLs.
 * Renders the recorder's state but does not own it; the parent owns
 * the `useRecorder` hook so the rrweb lifecycle can survive re-renders.
 */

import { useMemo } from "react";

import { useRecorder } from "@/hooks/use-recorder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RecorderStatus } from "@/lib/recording/types";

const STATUS_LABEL: Record<RecorderStatus, string> = {
  idle: "未开始",
  creating: "正在创建",
  recording: "录制中",
  flushing: "上传中",
  stopping: "正在停止",
  stopped: "已停止",
  error: "出错",
};

const STATUS_VARIANT: Record<
  RecorderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  idle: "outline",
  creating: "secondary",
  recording: "default",
  flushing: "secondary",
  stopping: "secondary",
  stopped: "outline",
  error: "destructive",
};

interface AgentSteerPanelProps {
  workspaceCode: string;
  /** Optional: when the demo page already owns the hook, pass it in. */
  recorder?: ReturnType<typeof useRecorder>;
}

export function AgentSteerPanel({
  workspaceCode,
  recorder,
}: AgentSteerPanelProps) {
  // Only create our own hook if the parent didn't pass one. This keeps the
  // rrweb lifecycle tied to a single instance even if the panel re-mounts.
  const own = useRecorder(workspaceCode);
  const { state, start, stop, segments } = recorder ?? own;

  const isActive = useMemo(
    () => state.status === "recording" || state.status === "flushing",
    [state.status],
  );
  const isBusy = useMemo(
    () =>
      state.status === "creating" ||
      state.status === "stopping" ||
      state.status === "flushing",
    [state.status],
  );

  const handleStart = async () => {
    try {
      await start();
    } catch (err) {
      // Error already recorded in state; console for devtools.
      console.error("[AgentSteerPanel] start failed:", err);
    }
  };

  const handleStop = async () => {
    try {
      await stop();
    } catch (err) {
      console.error("[AgentSteerPanel] stop failed:", err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Agent Steer · 录制</CardTitle>
          <Badge variant={STATUS_VARIANT[state.status]}>
            {STATUS_LABEL[state.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleStart}
            disabled={isActive || isBusy}
            className="flex-1"
          >
            开始录制
          </Button>
          <Button
            onClick={handleStop}
            disabled={!isActive}
            variant="outline"
            className="flex-1"
          >
            停止录制
          </Button>
        </div>

        {state.recordingUid && (
          <div className="text-xs text-muted-foreground">
            <span className="font-mono">{shorten(state.recordingUid)}</span>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">已上传 segment</div>
            <div className="font-mono">{state.segmentCount}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">上次上传</div>
            <div className="font-mono text-xs">
              {state.lastSegmentAt ? formatTime(state.lastSegmentAt) : "—"}
            </div>
          </div>
        </div>

        {state.pageUrls.length > 0 && (
          <div>
            <div className="text-muted-foreground text-xs mb-1">页面 URL</div>
            <ul className="space-y-1 text-xs">
              {state.pageUrls.slice(0, 5).map((url) => (
                <li
                  key={url}
                  className="truncate font-mono text-muted-foreground"
                  title={url}
                >
                  {url}
                </li>
              ))}
              {state.pageUrls.length > 5 && (
                <li className="text-muted-foreground">
                  +{state.pageUrls.length - 5} 个
                </li>
              )}
            </ul>
          </div>
        )}

        {segments.length > 0 && (
          <div>
            <div className="text-muted-foreground text-xs mb-1">已上传</div>
            <ul className="space-y-1 text-xs">
              {segments.slice(-3).map((s) => (
                <li key={s.uid} className="flex justify-between font-mono">
                  <span>#{s.sequence}</span>
                  <span className="text-muted-foreground">
                    {formatSize(s.size)} · {formatTime(s.endTime)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.errorMessage && (
          <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
            {state.errorMessage}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          每 10 分钟自动切分并上传一个新 segment；页面刷新会丢失当前 segment。
        </p>
      </CardContent>
    </Card>
  );
}

function shorten(uid: string): string {
  return uid.length > 16 ? `${uid.slice(0, 8)}…${uid.slice(-6)}` : uid;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
