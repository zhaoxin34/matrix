"use client";

/**
 * Edit Embedded Site Page
 *
 * 路由: /workspace/{workspace_code}/embedded-sites/{id}/edit
 * 功能: 修改 embedded-site
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditEmbeddedSiteForm } from "@/components/embedded-site";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete01Icon } from "@hugeicons/core-free-icons";
import { getEmbeddedSite, deleteEmbeddedSite } from "@/lib/api/embedded-sites";
import { toast } from "sonner";
import type { EmbeddedSite } from "@/components/embedded-site";

export default function EditEmbeddedSitePage() {
  const params = useParams();
  const router = useRouter();
  const workspace_code = params.workspace_code as string;
  const id = params.id as string;

  const [site, setSite] = useState<EmbeddedSite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从后端获取站点数据
    getEmbeddedSite(workspace_code, parseInt(id))
      .then((data) => {
        setSite(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch site:", error);
        toast.error("加载网站信息失败");
        setLoading(false);
        // 稍后跳回列表页
        setTimeout(
          () => router.push(`/workspace/${workspace_code}/embedded-sites`),
          2000,
        );
      });
  }, [workspace_code, id, router]);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个嵌入网站吗？")) return;

    try {
      await deleteEmbeddedSite(workspace_code, parseInt(id));
      toast.success("删除成功");
      router.push(`/workspace/${workspace_code}/embedded-sites`);
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "删除失败");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="space-y-6">
        <div className="text-center py-10">
          <p className="text-muted-foreground">网站不存在或已被删除</p>
          <Button variant="link" asChild className="mt-2">
            <Link href={`/workspace/${workspace_code}/embedded-sites`}>
              返回列表
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/workspace/${workspace_code}/embedded-sites`}>
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={1.5}
                className="size-4 mr-1"
              />
              返回
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-heading font-medium">编辑嵌入网站</h1>
            <p className="text-xs text-muted-foreground mt-1">
              修改嵌入网站的配置信息
            </p>
          </div>
        </div>

        {/* Delete Button */}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <HugeiconsIcon
            icon={Delete01Icon}
            strokeWidth={1.5}
            className="size-4 mr-1"
          />
          删除
        </Button>
      </div>

      {/* Form */}
      <div className="max-w-xl">
        <Card>
          <CardContent className="pt-6">
            <EditEmbeddedSiteForm
              siteId={id}
              workspaceCode={workspace_code}
              initialData={{
                site_name: site.site_name,
                site_url: site.site_url,
                description: site.description ?? "",
                status: site.status,
              }}
              successUrl={`/workspace/${workspace_code}/embedded-sites`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
