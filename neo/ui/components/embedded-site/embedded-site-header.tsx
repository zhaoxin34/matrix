"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import type { EmbeddedSiteStatus } from "./embedded-site-types";

interface EmbeddedSiteHeaderProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: EmbeddedSiteStatus | "all") => void;
  currentStatus: EmbeddedSiteStatus | "all";
  className?: string;
}

export function EmbeddedSiteHeader({
  onSearch,
  onStatusFilter,
  currentStatus,
  className,
}: EmbeddedSiteHeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);

      // Debounce the search callback
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onSearch(value);
      }, 300);
    },
    [onSearch],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ""}`}>
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          placeholder="搜索网站名称或URL..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={currentStatus}
        onValueChange={(value) =>
          onStatusFilter(value as EmbeddedSiteStatus | "all")
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="状态筛选" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          <SelectItem value="enabled">仅启用</SelectItem>
          <SelectItem value="disabled">仅禁用</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}