"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete04Icon,
  ViewIcon,
  Refresh01Icon,
  BlockedIcon,
  CheckmarkCircle02Icon,
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

import {
  disableInterceptor,
  enableInterceptor,
  getInterceptors,
} from "@/lib/api/interceptors";
import type { Interceptor } from "@/components/interceptor/interceptor-types";

interface InterceptorListProps {
  workspaceCode: string;
  initialData: {
    items: Interceptor[];
    total: number;
    page: number;
    page_size: number;
  };
  sites: Array<{ id: number; name: string }>;
}

export function InterceptorList({
  workspaceCode,
  initialData,
  sites,
}: InterceptorListProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(initialData.page);
  const [pageSize, setPageSize] = useState(initialData.page_size);
  const [siteFilter, setSiteFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(data.total / pageSize);
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

  const fetchData = useCallback(
    async (pageToFetch: number, size: number, site: string, status: string) => {
      setLoading(true);
      try {
        const filter: Record<string, unknown> = {
          page: pageToFetch,
          page_size: size,
        };
        if (site !== "__all__") {
          filter.embedded_site_id = Number(site);
        }
        if (status !== "__all__") {
          filter.status = status;
        }
        const result = await getInterceptors(
          workspaceCode,
          filter as Parameters<typeof getInterceptors>[1],
        );
        setData(result);
      } catch (error) {
        toast.error(String(error));
      } finally {
        setLoading(false);
      }
    },
    [workspaceCode],
  );

  // Fetch when filters or page changes (not on mount - use initialData)
  useEffect(() => {
    if (
      siteFilter !== "__all__" ||
      statusFilter !== "__all__" ||
      page !== initialData.page
    ) {
      fetchData(page, pageSize, siteFilter, statusFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, siteFilter, statusFilter]);

  const handleToggleStatus = async (interceptor: Interceptor) => {
    try {
      if (interceptor.status === "ENABLED") {
        await disableInterceptor(workspaceCode, interceptor.id);
        toast.success("已禁用");
      } else {
        await enableInterceptor(workspaceCode, interceptor.id);
        toast.success("已启用");
      }
      fetchData(page, pageSize, siteFilter, statusFilter);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await disableInterceptor(workspaceCode, deleteId);
      toast.success("已删除");
      setDeleteId(null);
      fetchData(page, pageSize, siteFilter, statusFilter);
    } catch (error) {
      toast.error(String(error));
    }
  };

  const getSiteName = (id: number) =>
    sites.find((s) => s.id === id)?.name || String(id);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="按站点筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部站点</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={String(site.id)}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="按状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部状态</SelectItem>
            <SelectItem value="ENABLED">已启用</SelectItem>
            <SelectItem value="DISABLED">已禁用</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(page, pageSize, siteFilter, statusFilter)}
          disabled={loading}
        >
          <HugeiconsIcon icon={Refresh01Icon} className="size-4 mr-1" />
          刷新
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">每页</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
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
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-16">
            <div className="text-sm text-muted-foreground">加载中...</div>
          </div>
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <HugeiconsIcon
              icon={Folder02Icon}
              strokeWidth={1.5}
              className="size-12 text-muted-foreground/50 mb-4"
            />
            <h3 className="text-sm font-medium mb-1">暂无拦截器</h3>
            <p className="text-sm text-muted-foreground">
              还没有创建任何拦截器
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            {/* Table Header */}
            <div className="flex items-center px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
              <div className="flex-1 min-w-0">名称</div>
              <div className="w-32 hidden md:block">事件</div>
              <div className="w-32 hidden lg:block">站点</div>
              <div className="w-20 hidden lg:block">类型</div>
              <div className="w-20 hidden lg:block">状态</div>
              <div className="w-32 hidden xl:block">更新时间</div>
              <div className="w-32 text-right">操作</div>
            </div>

            {/* Table Body */}
            <div className="divide-y">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <Link
                      href={`/workspace/${workspaceCode}/interceptors/${item.id}`}
                      className="font-medium text-primary hover:underline truncate block"
                    >
                      {item.name}
                    </Link>
                  </div>
                  <div className="w-32 hidden md:block font-mono text-sm truncate">
                    {item.event_name}
                  </div>
                  <div className="w-32 hidden lg:block text-sm text-muted-foreground truncate">
                    {getSiteName(item.embedded_site_id)}
                  </div>
                  <div className="w-20 hidden lg:block">
                    <Badge variant="outline">
                      {item.trigger_type === "dom" ? "DOM" : "Network"}
                    </Badge>
                  </div>
                  <div className="w-20 hidden lg:block">
                    <Badge
                      variant={
                        item.status === "ENABLED" ? "default" : "secondary"
                      }
                    >
                      {item.status === "ENABLED" ? "已启用" : "已禁用"}
                    </Badge>
                  </div>
                  <div className="w-32 hidden xl:block text-xs text-muted-foreground">
                    {new Date(item.updated_at).toLocaleString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="w-32 flex items-center justify-end gap-1">
                    <Link
                      href={`/workspace/${workspaceCode}/interceptors/${item.id}`}
                    >
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <HugeiconsIcon icon={ViewIcon} className="size-4" />
                      </Button>
                    </Link>
                    <Link
                      href={`/workspace/${workspaceCode}/interceptors/${item.id}/edit`}
                    >
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        编辑
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0"
                      onClick={() => handleToggleStatus(item)}
                      title={item.status === "ENABLED" ? "禁用" : "启用"}
                    >
                      <HugeiconsIcon
                        icon={
                          item.status === "ENABLED"
                            ? BlockedIcon
                            : CheckmarkCircle02Icon
                        }
                        className="size-4"
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(item.id)}
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
            <p className="text-sm text-muted-foreground">
              共 {data.total} 条记录
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 mr-1" />
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个拦截器吗？删除后可以随时重新启用。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
