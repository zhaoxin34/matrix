"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { KnowledgeCard } from "@/lib/api/knlg-base/_base";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface KnowledgeCardItemProps {
  card: KnowledgeCard;
  workspaceCode: string;
  onPublish?: (id: number) => void;
  onDeprecate?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function KnowledgeCardItem({
  card,
  workspaceCode,
  onPublish,
  onDeprecate,
  onDelete,
}: KnowledgeCardItemProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={
              `/workspace/${workspaceCode}/knlg-base/knowledge/cards/${card.id}` as `/${string}`
            }
            className="text-lg font-semibold text-primary hover:underline"
          >
            {card.title}
          </Link>
          <div className="flex gap-2">
            <Badge
              variant={card.status === "published" ? "default" : "secondary"}
            >
              {card.status}
            </Badge>
            <ConfidenceBadge value={card.confidence} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {card.statement}
        </p>
        <div className="mt-2 flex gap-2 flex-wrap">
          <Badge variant="outline">{card.domain}</Badge>
          <Badge variant="outline">{card.type}</Badge>
          {card.tags?.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              {t}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button asChild size="sm" variant="outline">
          <Link
            href={
              `/workspace/${workspaceCode}/knlg-base/knowledge/cards/${card.id}` as `/${string}`
            }
          >
            查看
          </Link>
        </Button>
        {card.status === "draft" && onPublish && (
          <Button size="sm" onClick={() => onPublish(card.id)}>
            发布
          </Button>
        )}
        {card.status === "published" && onDeprecate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDeprecate(card.id)}
          >
            废弃
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(card.id)}
          >
            删除
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
