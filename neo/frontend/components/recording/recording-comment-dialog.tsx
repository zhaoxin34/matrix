/**
 * RecordingCommentDialog — modal for creating or editing a segment comment.
 *
 * Layout:
 *   - Header: "新建标注 ─ segment #N" or "编辑标注 ─ segment #N"
 *   - Time-range inputs (show_time / hide_time), each prefilled with the
 *     default values from the dialog state.
 *   - Abstract (required, ≤50 chars) and content (optional, ≤5000 chars).
 *   - Footer: Cancel / Save (or Delete / Cancel / Save in edit mode when
 *     the current user is allowed).
 *
 * Permission model:
 *   - Save: any caller — backend enforces Admin/Owner for create, creator or
 *     Owner for update. We pass the current user id via `currentUserId` so
 *     the edit dialog can show/hide the [Delete] button.
 */

"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface RecordingCommentDialogProps {
  open: boolean;
  /** "create" or "edit" — controls title + presence of delete button. */
  mode: "create" | "edit";
  segmentLabel: string;
  /** Current segment sequence number (e.g. "#1") for display. */
  segmentSequence: number;
  /** Default start time (seconds, relative to segment start). */
  defaultShowTime: number;
  /** Default end time (seconds, relative to segment start). */
  defaultHideTime: number;
  /** Initial abstract / content for edit mode. */
  initialAbstract?: string;
  initialContent?: string | null;
  /** True when the current user is allowed to delete this comment. */
  canDelete?: boolean;
  /** Save in progress. */
  saving?: boolean;
  /** Called with the form values when the user confirms save. */
  onSave: (input: {
    show_time: number;
    hide_time: number;
    abstract: string;
    content: string | null;
  }) => void;
  /** Called when the user confirms delete (edit mode only). */
  onDelete?: () => void;
  /** Called when the user dismisses the dialog without saving. */
  onCancel: () => void;
}

function formatSeconds(s: number): string {
  const safe = Math.max(0, s);
  const m = Math.floor(safe / 60);
  const sec = Math.floor(safe % 60);
  const ms = Math.round((safe - Math.floor(safe)) * 1000);
  return `${m.toString().padStart(2, "0")}:${sec
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

function parseSeconds(text: string): number | null {
  const trimmed = text.trim();
  // Accept MM:SS.mmm or MM:SS or plain seconds.
  const colonMatch = /^(\d{1,3}):(\d{1,2})(?:\.(\d{1,3}))?$/.exec(trimmed);
  if (colonMatch) {
    const m = Number(colonMatch[1]);
    const s = Number(colonMatch[2]);
    const ms = colonMatch[3] ? Number(colonMatch[3].padEnd(3, "0")) : 0;
    return m * 60 + s + ms / 1000;
  }
  const num = Number(trimmed);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

export function RecordingCommentDialog({
  open,
  mode,
  segmentLabel,
  segmentSequence,
  defaultShowTime,
  defaultHideTime,
  initialAbstract = "",
  initialContent = null,
  canDelete = false,
  saving = false,
  onSave,
  onDelete,
  onCancel,
}: RecordingCommentDialogProps) {
  const [showText, setShowText] = React.useState(
    formatSeconds(defaultShowTime),
  );
  const [hideText, setHideText] = React.useState(
    formatSeconds(defaultHideTime),
  );
  const [abstract, setAbstract] = React.useState(initialAbstract);
  const [content, setContent] = React.useState(initialContent ?? "");
  const [error, setError] = React.useState<string | null>(null);

  // Reset when the dialog reopens with new defaults.
  React.useEffect(() => {
    if (!open) return;
    setShowText(formatSeconds(defaultShowTime));
    setHideText(formatSeconds(defaultHideTime));
    setAbstract(initialAbstract);
    setContent(initialContent ?? "");
    setError(null);
  }, [open, defaultShowTime, defaultHideTime, initialAbstract, initialContent]);

  const abstractTrimmed = abstract.trim();
  const abstractValid =
    abstractTrimmed.length > 0 && abstractTrimmed.length <= 50;

  const handleSave = () => {
    setError(null);
    const show = parseSeconds(showText);
    const hide = parseSeconds(hideText);
    if (show === null) {
      setError("起点时间格式无效，应为 MM:SS.mmm 或秒数");
      return;
    }
    if (hide === null) {
      setError("终点时间格式无效，应为 MM:SS.mmm 或秒数");
      return;
    }
    if (show < 0) {
      setError("起点不能为负数");
      return;
    }
    if (hide <= show) {
      setError("终点必须大于起点");
      return;
    }
    if (!abstractValid) {
      setError("摘要必填且不超过 50 字符");
      return;
    }
    onSave({
      show_time: show,
      hide_time: hide,
      abstract: abstractTrimmed,
      content: content.trim() ? content : null,
    });
  };

  const title =
    mode === "create"
      ? `新建标注 ─ ${segmentLabel} #${segmentSequence}`
      : `编辑标注 ─ ${segmentLabel} #${segmentSequence}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            标注附着在该片段的某个时段上。当回放播放到该时段时，标注会显示在画布气泡中。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Time range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">时间区间</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">起点</div>
                <Input
                  value={showText}
                  onChange={(e) => setShowText(e.target.value)}
                  placeholder="00:00.000"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">终点</div>
                <Input
                  value={hideText}
                  onChange={(e) => setHideText(e.target.value)}
                  placeholder="00:15.000"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 默认起点 = 当前播放位置；终点 = 起点 + 15s（可在弹窗内修改）
            </p>
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              摘要 <span className="text-destructive">*</span>
              <span className="ml-1 text-xs text-muted-foreground">
                (≤50 字符，用于列表与气泡标题)
              </span>
            </label>
            <Input
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              maxLength={50}
              placeholder="例如：为什么选择这群用户？"
            />
            <div className="text-xs text-muted-foreground text-right">
              {abstractTrimmed.length}/50
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium">详情（选填）</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="详细说明…"
              maxLength={5000}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          {mode === "edit" && canDelete && onDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={saving}
              className="mr-auto"
            >
              删除
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            取消
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
