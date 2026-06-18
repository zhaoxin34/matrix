"use client";

/**
 * Recording list with search, status filter, date range, pagination, sort,
 * selection, and batch operations (delete + add/remove tags).
 *
 * Spec coverage:
 *   5.1.1 list component
 *   5.1.2 search (name), tag filter, status filter, date range
 *   5.1.3 pagination + sort
 *   5.4.1 batch selection
 *   5.4.2 batch delete
 *   5.4.3 batch add/remove tags
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  batchDelete,
  batchUpdateTags,
  deleteRecording,
  getErrorMessage,
  listRecordings,
  type Recording,
  type RecordingStatus,
} from "@/lib/api/recording";

const PAGE_SIZE = 10;
const STATUS_LABEL: Record<RecordingStatus | "all", string> = {
  all: "全部状态",
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

interface RecordingListProps {
  workspaceCode: string;
  /** Optional: a "create recording" button is shown when this is set. */
  onUploadClick?: () => void;
  /** Optional: a refresh trigger. Bump to force reload. */
  refreshKey?: number;
}

export function RecordingList({
  workspaceCode,
  onUploadClick,
  refreshKey,
}: RecordingListProps) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RecordingStatus | "all">("all");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Batch
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listRecordings(workspaceCode, {
        search: search || undefined,
        tags: tags.length ? tags : undefined,
        status: status === "all" ? undefined : status,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        sort,
        order,
        page,
        size: PAGE_SIZE,
      });
      setRecordings(res.items);
      setTotal(res.total);
    } catch (err) {
      toast.error(`加载失败：${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [
    workspaceCode,
    search,
    tags,
    status,
    fromDate,
    toDate,
    sort,
    order,
    page,
  ]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageUids = useMemo(() => recordings.map((r) => r.uid), [recordings]);
  const allOnPageSelected =
    pageUids.length > 0 && pageUids.every((u) => selected.has(u));

  const toggleAllOnPage = () => {
    const next = new Set(selected);
    if (allOnPageSelected) {
      pageUids.forEach((u) => next.delete(u));
    } else {
      pageUids.forEach((u) => next.add(u));
    }
    setSelected(next);
  };

  const toggleOne = (uid: string) => {
    const next = new Set(selected);
    if (next.has(uid)) next.delete(uid);
    else next.add(uid);
    setSelected(next);
  };

  const onDelete = async (uid: string) => {
    if (!confirm("确认删除该录像？该操作不可恢复。")) return;
    try {
      await deleteRecording(workspaceCode, uid);
      toast.success("已删除");
      setSelected((s) => {
        const next = new Set(s);
        next.delete(uid);
        return next;
      });
      void fetchPage();
    } catch (err) {
      toast.error(`删除失败：${getErrorMessage(err)}`);
    }
  };

  const onBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`确认删除所选 ${selected.size} 条录像？该操作不可恢复。`))
      return;
    setBatchBusy(true);
    try {
      const res = await batchDelete(workspaceCode, Array.from(selected));
      toast.success(`已删除 ${res.deleted} 条`);
      setSelected(new Set());
      void fetchPage();
    } catch (err) {
      toast.error(`批量删除失败：${getErrorMessage(err)}`);
    } finally {
      setBatchBusy(false);
    }
  };

  const onBatchTag = async (action: "add" | "remove") => {
    if (selected.size === 0) return;
    const tagStr = prompt(
      `输入要${action === "add" ? "添加" : "移除"}的标签（逗号分隔）：`,
    );
    if (!tagStr) return;
    const newTags = tagStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!newTags.length) return;
    setBatchBusy(true);
    try {
      const res = await batchUpdateTags(
        workspaceCode,
        Array.from(selected),
        action,
        newTags,
      );
      toast.success(`已更新 ${res.updated} 条`);
      setSelected(new Set());
      void fetchPage();
    } catch (err) {
      toast.error(`批量标签失败：${getErrorMessage(err)}`);
    } finally {
      setBatchBusy(false);
    }
  };

  const addTagFilter = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
      setPage(1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter row — single line on xl+; wraps + scrolls on narrower viewports */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <div className="flex flex-nowrap items-center gap-2 min-w-max">
            <Input
              placeholder="按名称搜索"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-44"
            />
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as RecordingStatus | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              title="开始日期"
              className="w-36"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              title="结束日期"
              className="w-36"
            />
            <Input
              placeholder="标签筛选（回车）"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTagFilter();
                }
              }}
              className="w-40"
            />
            <Select
              value={`${sort}:${order}`}
              onValueChange={(v) => {
                const [s, o] = v.split(":");
                setSort(s);
                setOrder(o as "asc" | "desc");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at:desc">最新创建</SelectItem>
                <SelectItem value="created_at:asc">最早创建</SelectItem>
                <SelectItem value="name:asc">名称 A-Z</SelectItem>
                <SelectItem value="name:desc">名称 Z-A</SelectItem>
                <SelectItem value="total_duration:desc">时长降序</SelectItem>
              </SelectContent>
            </Select>
            {onUploadClick && <Button onClick={onUploadClick}>上传录像</Button>}
          </div>

          {/* Active tag chips on a second row, only when present */}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    setTags(tags.filter((x) => x !== t));
                    setPage(1);
                  }}
                >
                  {t} ×
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded">
          <span className="text-sm">已选 {selected.size} 条</span>
          <Button
            size="sm"
            variant="outline"
            disabled={batchBusy}
            onClick={() => onBatchTag("add")}
          >
            添加标签
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={batchBusy}
            onClick={() => onBatchTag("remove")}
          >
            移除标签
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={batchBusy}
            onClick={onBatchDelete}
          >
            批量删除
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            取消
          </Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            暂无录像
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
            <Checkbox
              checked={allOnPageSelected}
              onCheckedChange={toggleAllOnPage}
            />
            <span>全选当前页</span>
          </div>
          {recordings.map((r) => (
            <RecordingRow
              key={r.uid}
              recording={r}
              workspaceCode={workspaceCode}
              selected={selected.has(r.uid)}
              onToggle={() => toggleOne(r.uid)}
              onDelete={() => onDelete(r.uid)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            共 {total} 条 · 第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordingRow({
  recording,
  workspaceCode,
  selected,
  onToggle,
  onDelete,
}: {
  recording: Recording;
  workspaceCode: string;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-3 flex items-center gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${workspaceCode}/recordings/${recording.uid}`}
              className="font-medium hover:underline truncate"
            >
              {recording.name}
            </Link>
            <Badge variant={STATUS_BADGE[recording.status]}>
              {STATUS_LABEL[recording.status]}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
            <span>{recording.segment_count} 段</span>
            <span>{formatDuration(recording.total_duration)}</span>
            <span>{formatSize(recording.total_size)}</span>
            <span>{new Date(recording.created_at).toLocaleString()}</span>
            {recording.tags.length > 0 && (
              <span className="flex gap-1">
                {recording.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link
              href={`/workspace/${workspaceCode}/recordings/${recording.uid}/play`}
            >
              回放
            </Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
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
