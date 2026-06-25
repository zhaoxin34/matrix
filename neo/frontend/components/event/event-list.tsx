"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder02Icon,
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete04Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EventHeader } from "./event-header";
import type { Event } from "./event-types";
import { listEvents, deleteEvent, getErrorMessage } from "@/lib/api/events";

interface EventListProps {
  workspaceCode: string;
  className?: string;
}

export function EventList({ workspaceCode, className }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [siteId, setSiteId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  const fetchEvents = useCallback(
    async (searchQuery: string, pageNum: number) => {
      setLoading(true);
      try {
        const response = await listEvents(workspaceCode, {
          page: pageNum,
          page_size: pageSize,
          name: searchQuery || undefined,
          embedded_site_id: siteId,
        });
        setEvents(response.list);
        setTotal(response.total);
        setTotalPages(response.total_pages);
        setPage(response.page);
      } catch (error) {
        const err = error as { code?: number };
        toast.error(getErrorMessage(err.code || 9001));
      } finally {
        setLoading(false);
      }
    },
    [workspaceCode, pageSize, siteId],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const response = await listEvents(workspaceCode, {
          page: 1,
          page_size: pageSize,
          name: search || undefined,
          embedded_site_id: siteId,
        });
        if (!cancelled) {
          setEvents(response.list);
          setTotal(response.total);
          setTotalPages(response.total_pages);
          setPage(response.page);
        }
      } catch (error) {
        if (!cancelled) {
          const err = error as { code?: number };
          toast.error(getErrorMessage(err.code || 9001));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceCode, search, pageSize, siteId]);

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      setPage(1); // Reset to first page
      fetchEvents(search, 1);
    },
    [fetchEvents, search],
  );

  const handleSiteFilter = useCallback(
    (newSiteId: number | undefined) => {
      setSiteId(newSiteId);
      setPage(1);
      fetchEvents(search, 1);
    },
    [fetchEvents, search],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearch(query);
      fetchEvents(query, 1);
    },
    [fetchEvents],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      fetchEvents(search, newPage);
    },
    [fetchEvents, search],
  );

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    try {
      await deleteEvent(workspaceCode, deleteId);
      toast.success("事件已删除");
      setDeleteId(null);
      fetchEvents(search, page);
    } catch (error) {
      const err = error as { code?: number };
      toast.error(getErrorMessage(err.code || 9001));
    } finally {
      setDeleting(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <EventHeader
          onSearch={handleSearch}
          onSiteFilter={handleSiteFilter}
          currentSearch={search}
          currentSiteId={siteId}
          workspaceCode={workspaceCode}
        />
        <Link href={`/workspace/${workspaceCode}/events/new`}>
          <Button size="sm">
            <HugeiconsIcon icon={Add01Icon} className="size-4 mr-1" />
            创建
          </Button>
        </Link>
      </div>

      {/* List */}
      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-muted-foreground">加载中...</div>
          </div>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <HugeiconsIcon
              icon={Folder02Icon}
              strokeWidth={1.5}
              className="size-12 text-muted-foreground/50 mb-4"
            />
            <h3 className="text-sm font-medium mb-1">暂无事件</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "没有找到匹配的事件" : "事件数据将从用户行为中自动生成"}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            {/* Table Header */}
            <div className="flex items-center px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
              <div className="flex-1 min-w-0">事件名称</div>
              <div className="w-32 hidden md:block">实体名称</div>
              <div className="w-24 hidden lg:block">操作者</div>
              <div className="w-40 hidden lg:block">时间</div>
              <div className="w-24 text-right">操作</div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <Link
                      href={`/workspace/${workspaceCode}/events/${event.id}/edit`}
                      className="font-medium text-primary hover:underline truncate block"
                    >
                      {event.name}
                    </Link>
                    {event.page_url && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {event.page_url}
                      </p>
                    )}
                  </div>
                  <div className="w-32 hidden md:block text-sm text-muted-foreground truncate">
                    {event.entity_name}
                  </div>
                  <div className="w-24 hidden lg:block text-sm text-muted-foreground">
                    {event.actor}
                  </div>
                  <div className="w-40 hidden lg:block text-xs text-muted-foreground">
                    {formatTimestamp(event.timestamp)}
                  </div>
                  <div className="w-24 flex items-center justify-end gap-1">
                    <Link
                      href={`/workspace/${workspaceCode}/events/${event.id}/edit`}
                    >
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <HugeiconsIcon icon={ViewIcon} className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(event.id)}
                    >
                      <HugeiconsIcon icon={Delete04Icon} className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">共 {total} 条记录</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => handlePageSizeChange(Number(v))}
                >
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">条</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 mr-1" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                下一页
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-4 ml-1"
                />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，这将永久删除该事件记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
