"use client";

import { Button } from "@/components/ui/button";

export default function KnlgBaseError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-2">出错了</h2>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>重试</Button>
    </div>
  );
}