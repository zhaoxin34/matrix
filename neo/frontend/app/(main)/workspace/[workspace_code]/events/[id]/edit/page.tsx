"use client";

/**
 * Event Edit Page
 *
 * 路由: /workspace/{workspace_code}/events/{id}/edit
 * 功能: 编辑事件
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/event/event-form";
import { getEvent } from "@/lib/api/events";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";
import type { Event } from "@/components/event";
import type { EmbeddedSite } from "@/components/embedded-site";

export default function EventEditPage() {
  const params = useParams();
  const router = useRouter();
  const workspace_code = params.workspace_code as string;
  const id = params.id as string;
  const eventId = parseInt(id, 10);

  const [event, setEvent] = useState<Event | null>(null);
  const [sites, setSites] = useState<EmbeddedSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(eventId)) {
      toast.error("无效的事件 ID");
      router.push(`/workspace/${workspace_code}/events`);
      return;
    }

    Promise.all([
      getEvent(workspace_code, eventId),
      listEmbeddedSites(workspace_code, { page: 1, page_size: 100 }),
    ])
      .then(([eventData, sitesData]) => {
        setEvent(eventData);
        setSites(sitesData.list);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch data:", error);
        toast.error("加载数据失败");
        setLoading(false);
        setTimeout(() => {
          router.push(`/workspace/${workspace_code}/events`);
        }, 2000);
      });
  }, [workspace_code, eventId, router]);

  const handleSuccess = () => {
    router.push(`/workspace/${workspace_code}/events`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/workspace/${workspace_code}/events`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4 mr-2" />
            返回列表
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-heading font-medium">编辑事件</h1>
          <p className="text-xs text-muted-foreground mt-1">修改事件信息</p>
        </div>
      </div>

      {/* Event Form */}
      <EventForm
        workspaceCode={workspace_code}
        event={event}
        sites={sites}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
