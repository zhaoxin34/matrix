"use client";

import { Card } from "@/components/ui/card";

export function RuleConditionTree({
  conditions,
}: {
  conditions: Array<Record<string, unknown>>;
}) {
  if (!conditions || conditions.length === 0) {
    return <p className="text-sm text-muted-foreground">无条件</p>;
  }
  return (
    <div className="space-y-2">
      {conditions.map((cond, idx) => (
        <Card key={idx} className="p-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">字段：</span>
              {String(cond.field ?? "")}
            </div>
            <div>
              <span className="text-muted-foreground">操作符：</span>
              {String(cond.operator ?? "")}
            </div>
            <div>
              <span className="text-muted-foreground">值：</span>
              {String(cond.value ?? "")}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
