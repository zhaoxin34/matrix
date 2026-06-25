"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteEvent } from "@/lib/api/events";
import { CalendarIcon, UserIcon, LinkIcon } from "lucide-react";
import type { Event } from "./event-types";

interface EventCardProps {
  event: Event;
  workspaceCode: string;
  onDeleted?: () => void;
}

export function EventCard({ event, workspaceCode, onDeleted }: EventCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEvent(workspaceCode, event.id);
      toast.success("事件已删除");
      onDeleted?.();
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err.message || "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <Link href={`/workspace/${workspaceCode}/events/${event.id}/edit`}>
              <h3 className="font-medium text-sm leading-tight hover:text-primary cursor-pointer">
                {event.name}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground font-mono">
              {event.entity_name}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive">
                删除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除事件 &quot;{event.name}&quot; 吗？此操作不可撤销。
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserIcon className="size-3" />
          <span className="font-mono">{event.actor}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarIcon className="size-3" />
          <span>{formatDate(event.timestamp)}</span>
        </div>

        {event.page_url && (
          <div className="flex items-center gap-2 text-xs">
            <LinkIcon className="size-3 text-muted-foreground" />
            <a
              href={event.page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate max-w-[200px]"
            >
              {event.page_url}
            </a>
          </div>
        )}

        {event.session_id && (
          <div className="text-xs text-muted-foreground font-mono">
            Session: {event.session_id}
          </div>
        )}

        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">元数据</span>
              <Textarea
                value={JSON.stringify(event.metadata, null, 2)}
                readOnly
                className="text-xs font-mono h-20 resize-none"
              />
            </div>
          </>
        )}

        {event.target_entity_name && (
          <Badge variant="outline" className="text-xs">
            目标: {event.target_entity_name}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
