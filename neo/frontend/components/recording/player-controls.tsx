/**
 * PlayerControls — bottom control bar for the rrweb Replayer.
 *
 * Pure presentational. Drives a `ReplayerController` via callbacks.
 * Subscribes to controller events to keep the time / play-state in sync
 * without re-rendering the whole tree.
 *
 * Layout (mimics the rrweb-player reference):
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░ 0:02 / 0:15       │  ← progress
 *   │              ▶  1x 2x 4x 8x  ○ skip inactive  ⛶            │  ← controls
 *   └──────────────────────────────────────────────────────────┘
 *
 * Controls are centered and packed tight (gap-1) so the bar feels
 * compact, the way the reference does. The fullscreen button is the
 * only thing on the right; everything else flows into the centered
 * group.
 */
"use client";

import * as React from "react";
import { Maximize2, Minus, Pause, Play, Plus, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ReplayerController } from "@/lib/recording/replayer-controller";

const SPEED_OPTIONS = [1, 2, 4, 8] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

export interface PlayerControlsProps {
  controller: ReplayerController | null;
  /** Current zoom scale (0.5 - 2.0), default 0.8 */
  zoom?: number;
  /** Called when user changes zoom */
  onZoomChange?: (zoom: number) => void;
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;
const ZOOM_DEFAULT = 0.8;

export function PlayerControls({
  controller,
  zoom = ZOOM_DEFAULT,
  onZoomChange,
}: PlayerControlsProps) {
  const [currentTime, setCurrentTime] = React.useState(0);
  const [totalTime, setTotalTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<Speed>(1);
  const [skipInactive, setSkipInactive] = React.useState(false);
  const [scrubbing, setScrubbing] = React.useState(false);
  const [localZoom, setLocalZoom] = React.useState(zoom);

  // Sync localZoom when prop changes
  React.useEffect(() => {
    setLocalZoom(zoom);
  }, [zoom]);

  // Subscribe to controller events.
  React.useEffect(() => {
    if (!controller) return;

    setTotalTime(controller.getTotalTime());
    setSpeed(controller.getSpeed());
    setSkipInactive(controller.getSkipInactive());
    setPlaying(controller.isPlaying());

    const offTime = controller.on("timeupdate", () => {
      if (!scrubbing) setCurrentTime(controller.getCurrentTime());
    });
    const offPlay = controller.on("playing", () => setPlaying(true));
    const offPause = controller.on("pause", () => setPlaying(false));
    const offFinish = controller.on("finish", () => setPlaying(false));

    // Cheap safety net: reconcile the playing flag from the
    // controller on every tick in case we missed the event.
    const offAnyTime = controller.on("timeupdate", () => {
      setPlaying(controller.isPlaying());
    });

    return () => {
      offTime();
      offPlay();
      offPause();
      offFinish();
      offAnyTime();
    };
  }, [controller, scrubbing]);

  const onScrubStart = () => setScrubbing(true);
  const onScrub = (vals: number[]) => {
    setCurrentTime(vals[0] ?? 0);
  };
  const onScrubCommit = (vals: number[]) => {
    setScrubbing(false);
    controller?.seek(vals[0] ?? 0);
  };

  const onTogglePlay = () => controller?.togglePlay();
  const onSpeedChange = (s: Speed) => {
    setSpeed(s);
    controller?.setSpeed(s);
  };
  const onSkipChange = (v: boolean) => {
    setSkipInactive(v);
    controller?.setSkipInactive(v);
  };
  const onFullscreen = () => {
    void controller?.enterFullscreen();
  };

  const disabled = !controller;

  return (
    <div
      className={cn(
        "border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        "flex flex-col gap-2 px-4 py-2 select-none",
      )}
    >
      {/* progress bar (top, full width) */}
      <div className="flex items-center gap-3">
        <Slider
          value={[Math.min(currentTime, totalTime)]}
          min={0}
          max={Math.max(totalTime, 1)}
          step={100}
          disabled={disabled}
          onPointerDown={onScrubStart}
          onValueChange={onScrub}
          onValueCommit={onScrubCommit}
          className="flex-1"
          aria-label="播放进度"
        />
        <span className="text-xs text-muted-foreground tabular-nums font-mono w-20 text-right">
          {formatTime(currentTime)} / {formatTime(totalTime)}
        </span>
      </div>

      {/* controls (bottom, centered) — mirrors the rrweb-player reference.
			    All controls share the same h-8 w-8 square footprint so they
			    look like one tight group. gap-1 keeps them packed. */}
      <div className="flex items-center gap-1 justify-center">
        {/* play / pause */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={playing ? "暂停" : "播放"}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* speed pills — same h-8 w-8 square shape as the play button */}
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeedChange(s)}
            disabled={disabled}
            aria-pressed={speed === s}
            className={cn(
              "h-8 w-8 rounded-md text-xs font-medium transition-colors",
              "disabled:opacity-50 disabled:pointer-events-none",
              speed === s
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {s}x
          </button>
        ))}

        {/* skip inactive — switch + label, same vertical baseline */}
        <label
          htmlFor="skip-inactive"
          className={cn(
            "h-8 px-2 inline-flex items-center gap-2 rounded-md cursor-pointer transition-colors",
            "hover:bg-muted/50",
            disabled && "opacity-50 pointer-events-none",
          )}
        >
          <Switch
            id="skip-inactive"
            size="sm"
            checked={skipInactive}
            onCheckedChange={onSkipChange}
            disabled={disabled}
          />
          <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground select-none">
            skip inactive
          </span>
        </label>

        {/* zoom controls — label + minus button + slider + plus button + percentage */}
        <label
          className={cn(
            "h-8 px-2 inline-flex items-center gap-1.5 rounded-md cursor-pointer transition-colors",
            "hover:bg-muted/50",
            disabled && "opacity-50 pointer-events-none",
          )}
        >
          <span className="text-xs text-muted-foreground select-none whitespace-nowrap">
            缩放
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md"
            onClick={() => {
              const newZoom = Math.max(ZOOM_MIN, localZoom - 0.1);
              setLocalZoom(newZoom);
              onZoomChange?.(newZoom);
            }}
            disabled={disabled || localZoom <= ZOOM_MIN}
            aria-label="缩小 10%"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Slider
            value={[localZoom * 100]}
            min={ZOOM_MIN * 100}
            max={ZOOM_MAX * 100}
            step={5}
            disabled={disabled}
            onValueChange={(vals) => setLocalZoom(vals[0] / 100)}
            onValueCommit={(vals) => onZoomChange?.(vals[0] / 100)}
            className="w-20"
            aria-label="缩放"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md"
            onClick={() => {
              const newZoom = Math.min(ZOOM_MAX, localZoom + 0.1);
              setLocalZoom(newZoom);
              onZoomChange?.(newZoom);
            }}
            disabled={disabled || localZoom >= ZOOM_MAX}
            aria-label="放大 10%"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums font-mono w-10 select-none">
            {Math.round(localZoom * 100)}%
          </span>
        </label>

        {/* fullscreen — right of the group, same square shape */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md"
          onClick={onFullscreen}
          disabled={disabled}
          aria-label="全屏"
          title="全屏"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
