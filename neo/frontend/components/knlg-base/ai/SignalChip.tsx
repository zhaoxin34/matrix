"use client";

import { Badge } from "@/components/ui/badge";

const SIGNAL_LABELS: Record<string, { label: string; color: string }> = {
  pain_point: { label: "痛点", color: "bg-red-100 text-red-800" },
  opportunity: { label: "商机", color: "bg-green-100 text-green-800" },
  counter_example: { label: "反例", color: "bg-yellow-100 text-yellow-800" },
  boundary: { label: "边界", color: "bg-blue-100 text-blue-800" },
  key_metric: { label: "指标", color: "bg-purple-100 text-purple-800" },
};

interface SignalChipProps {
  type: string;
  confidence: number;
  text: string;
}

export function SignalChip({ type, confidence, text }: SignalChipProps) {
  const meta = SIGNAL_LABELS[type] ?? { label: type, color: "bg-gray-100" };
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1 ${meta.color} text-xs`}
    >
      <Badge variant="outline" className="bg-white/50">
        {meta.label}
      </Badge>
      <span className="text-muted-foreground">
        {(confidence * 100).toFixed(0)}%
      </span>
      <span className="max-w-xs truncate">{text}</span>
    </div>
  );
}
