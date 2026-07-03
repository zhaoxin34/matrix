"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SourceRef } from "@/lib/api/knlg-base/_base";

export function SourceRefList({ refs }: { refs: SourceRef[] }) {
  if (refs.length === 0) {
    return <p className="text-sm text-muted-foreground">无来源引用</p>;
  }
  return (
    <div className="space-y-2">
      {refs.map((ref) => (
        <Card key={ref.id} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Badge>{ref.source_type}</Badge>
            <span className="text-xs text-muted-foreground">
              权重: {ref.contribution_weight}
            </span>
          </div>
          {ref.source_excerpt && (
            <p className="text-sm text-muted-foreground italic">
              {ref.source_excerpt}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
