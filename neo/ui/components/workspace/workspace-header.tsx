"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import type { WorkspaceStatus } from "./workspace-types";

interface WorkspaceHeaderProps {
  onSearch?: (query: string) => void;
  onStatusFilter?: (status: WorkspaceStatus | "all") => void;
  currentStatus?: WorkspaceStatus | "all";
  showCreateButton?: boolean;
  className?: string;
}

export function WorkspaceHeader({
  onSearch,
  onStatusFilter,
  currentStatus = "all",
  showCreateButton = true,
  className,
}: WorkspaceHeaderProps) {
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = () => {
    onSearch?.(searchValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={1.5}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          />
          <Input
            type="search"
            placeholder="搜索工作区..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={currentStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilter?.("all")}
          >
            全部
          </Button>
          <Button
            variant={currentStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilter?.("active")}
          >
            活跃
          </Button>
          <Button
            variant={currentStatus === "disabled" ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusFilter?.("disabled")}
          >
            已禁用
          </Button>
        </div>
      </div>

      {showCreateButton && (
        <Button asChild>
          <Link href="/workspace/new">
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            新建工作区
          </Link>
        </Button>
      )}
    </div>
  );
}
