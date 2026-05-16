"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle03Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { EmbeddedSiteStatus } from "./embedded-site-types";

interface EmbeddedSiteStatusBadgeProps {
  status: EmbeddedSiteStatus;
  className?: string;
}

export function EmbeddedSiteStatusBadge({
  status,
  className,
}: EmbeddedSiteStatusBadgeProps) {
  const isEnabled = status === "enabled";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isEnabled
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
        } ${className ?? ""}`}
    >
      <HugeiconsIcon
        icon={isEnabled ? CheckmarkCircle03Icon : Cancel01Icon}
        strokeWidth={1.5}
        className="size-3"
      />
      {isEnabled ? "启用" : "禁用"}
    </div>
  );
}