"use client";

/**
 * Recording detail view.
 *
 * Spec coverage:
 *   5.2.1 basic info + segment list
 *   5.2.2 rename
 *   5.2.3 tag management (add/remove)
 *   5.2.4 delete (with confirmation)
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteRecording,
  getErrorMessage,
  getRecording,
  updateRecording,
  type RecordingDetail,
  type RecordingStatus,
} from "@/lib/api/recording";

const STATUS_LABEL: Record<RecordingStatus, string> = {
  recording: "录制中",
  completed: "已完成",
  failed: "失败",
};
const STATUS_BADGE: Record<
  RecordingStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  recording: "default",
  completed: "secondary",
  failed: "destructive",
};

interface Props {
  workspaceCode: string;
  recordingUid: string;
}

export function RecordingDetail({ workspaceCode, recordingUid }: Props) {
  const router = useRouter();
  const [recording, setRecording] = useState<RecordingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecording(workspaceCode, recordingUid);
      setRecording(data);
      setNameDraft(data.name);
    } catch (err) {
      toast.error(`加载失败：${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [workspaceCode, recordingUid]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const saveName = async () => {
    if (!recording || nameDraft === recording.name) {
      setEditingName(false);
      return;
    }
    setBusy(true);
    try {
      const updated = await updateRecording(workspaceCode, recordingUid, {
        name: nameDraft,
      });
      setRecording({ ...recording, ...updated });
      setEditingName(false);
      toast.success("已重命名");
    } catch (err) {
      toast.error(`重命名失败：${getErrorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const addTag = async () => {
    if (!recording) return;
    const t = newTag.trim();
    if (!t || recording.tags.includes(t)) return;
    setBusy(true);
    try {
      const next = [...recording.tags, t];
      const updated = await updateRecording(workspaceCode, recordingUid, {
        tags: next,
      });
      setRecording({ ...recording, ...updated });
      setNewTag("");
    } catch (err) {
      toast.error(`添加标签失败：${getErrorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const removeTag = async (tag: string) => {
    if (!recording) return;
    setBusy(true);
    try {
      const next = recording.tags.filter((t) => t !== tag);
      const updated = await updateRecording(workspaceCode, recordingUid, {
        tags: next,
      });
      setRecording({ ...recording, ...updated });
    } catch (err) {
      toast.error(`移除标签失败：${getErrorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const completeRecording = async () => {
    if (!recording) return;
    setBusy(true);
    try {
      const updated = await updateRecording(workspaceCode, recordingUid, {
        status: "completed",
      });
      setRecording({ ...recording, ...updated });
      toast.success("已标记为完成");
    } catch (err) {
      toast.error(`操作失败：${getErrorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(`确认删除录像「${recording?.name}」？该操作不可恢复。`))
      return;
    setBusy(true);
    try {
      await deleteRecording(workspaceCode, recordingUid);
      toast.success("已删除");
      router.push(`/workspace/${workspaceCode}/recordings`);
    } catch (err) {
      toast.error(`删除失败：${getErrorMessage(err)}`);
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!recording) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          录像不存在或已被删除
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    disabled={busy}
                  />
                  <Button onClick={saveName} disabled={busy} size="sm">
                    保存
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingName(false);
                      setNameDraft(recording.name);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="truncate">{recording.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingName(true)}
                  >
                    重命名
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={STATUS_BADGE[recording.status]}>
                  {STATUS_LABEL[recording.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  uid:{" "}
                  <span className="font-mono">{shorten(recording.uid)}</span>
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button asChild>
                <Link
                  href={`/workspace/${workspaceCode}/recordings/${recording.uid}/play`}
                >
                  回放
                </Link>
              </Button>
              {recording.status === "recording" && (
                <Button
                  onClick={completeRecording}
                  disabled={busy}
                  variant="outline"
                >
                  标记完成
                </Button>
              )}
              <Button onClick={onDelete} disabled={busy} variant="destructive">
                删除
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="段数" value={String(recording.segments.length)} />
            <Field
              label="总时长"
              value={formatDuration(recording.total_duration)}
            />
            <Field label="总大小" value={formatSize(recording.total_size)} />
            <Field
              label="来源"
              value={recording.source === "agent" ? "Agent Steer" : "手工上传"}
            />
            <Field
              label="创建时间"
              value={new Date(recording.created_at).toLocaleString()}
            />
            <Field label="进入 URL" value={recording.enter_url || "—"} mono />
            <Field label="退出 URL" value={recording.exit_url || "—"} mono />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="text-sm font-medium">标签</div>
            <div className="flex flex-wrap gap-1 items-center">
              {recording.tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(t)}
                  title="点击移除"
                >
                  {t} ×
                </Badge>
              ))}
              <div className="flex gap-1">
                <Input
                  placeholder="新标签"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addTag();
                    }
                  }}
                  disabled={busy}
                  className="w-32 h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addTag}
                  disabled={busy || !newTag.trim()}
                >
                  添加
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Segments（{recording.segments.length}）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recording.segments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              暂无 segment
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">#</th>
                  <th className="text-left py-2">起始时间</th>
                  <th className="text-left py-2">结束时间</th>
                  <th className="text-right py-2">大小</th>
                  <th className="text-right py-2">页面数</th>
                </tr>
              </thead>
              <tbody>
                {recording.segments.map((s) => (
                  <tr key={s.uid} className="border-b last:border-0">
                    <td className="py-2 font-mono">{s.sequence}</td>
                    <td className="py-2">{formatTime(s.start_time)}</td>
                    <td className="py-2">{formatTime(s.end_time)}</td>
                    <td className="py-2 text-right">{formatSize(s.size)}</td>
                    <td className="py-2 text-right">{s.page_urls.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs truncate" : ""}>{value}</div>
    </div>
  );
}

function shorten(uid: string): string {
  return uid.length > 16 ? `${uid.slice(0, 8)}…${uid.slice(-6)}` : uid;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatSize(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
