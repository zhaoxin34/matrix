"use client";

import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronRight, ChevronDown } from "@hugeicons/core-free-icons";
import type { SelectablePrototype } from "@/components/agent-factory/agent-factory-types";

export { type PrototypeOptionItemProps } from "./types";

interface PrototypeOptionItemProps {
  prototype: SelectablePrototype;
  isExpanded: boolean;
  onPrototypeClick: () => void;
  onVersionClick: (version: string) => void;
}

export function PrototypeOptionItem({
  prototype,
  isExpanded,
  onPrototypeClick,
  onVersionClick,
}: PrototypeOptionItemProps) {
  return (
    <div className="relative">
      {/* 一级：原型名称 */}
      <div
        className="px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer flex items-center justify-between"
        onClick={onPrototypeClick}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{prototype.name}</span>
            <span className="text-xs text-muted-foreground">
              v{prototype.current_version}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {prototype.code}
          </p>
        </div>
        <HugeiconsIcon
          icon={isExpanded ? ChevronDown : ChevronRight}
          strokeWidth={1.5}
          className="size-4 text-muted-foreground ml-2 shrink-0"
        />
      </div>

      {/* 二级：版本列表（点击展开） */}
      {isExpanded && (
        <div className="bg-accent/30 border-t border-b">
          <div className="px-4 py-2">
            <p className="text-xs text-muted-foreground mb-2">选择版本</p>
            <div className="space-y-1">
              {/* Latest 选项 */}
              <button
                className="w-full px-3 py-2 text-left hover:bg-accent transition-colors rounded-md"
                onClick={() => onVersionClick("latest")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Latest</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (v{prototype.current_version})
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    始终使用最新版本
                  </span>
                </div>
              </button>
              {/* 具体版本列表 */}
              {prototype.versions.map((v) => (
                <button
                  key={v.id}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors rounded-md"
                  onClick={() => onVersionClick(v.version)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">v{v.version}</span>
                      {v.version === prototype.current_version && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs py-0"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    {v.change_summary && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {v.change_summary}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
