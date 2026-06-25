"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";
import type { EmbeddedSite } from "@/components/embedded-site";

interface EventHeaderProps {
  onSearch: (query: string) => void;
  onSiteFilter: (siteId: number | undefined) => void;
  currentSearch: string;
  currentSiteId?: number;
  workspaceCode: string;
  className?: string;
}

export function EventHeader({
  onSearch,
  onSiteFilter,
  currentSearch,
  currentSiteId,
  workspaceCode,
  className,
}: EventHeaderProps) {
  const [sites, setSites] = useState<EmbeddedSite[]>([]);

  useEffect(() => {
    listEmbeddedSites(workspaceCode, { page: 1, page_size: 100 })
      .then((response) => setSites(response.list))
      .catch(() => {
        // Ignore errors
      });
  }, [workspaceCode]);

  return (
    <div className={`flex items-center gap-4 ${className ?? ""}`}>
      <div className="relative flex-1 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="搜索事件名称..."
          defaultValue={currentSearch}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={currentSiteId?.toString() || "all"}
        onValueChange={(v) => {
          if (v === "all") {
            onSiteFilter(undefined);
          } else {
            onSiteFilter(Number(v));
          }
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="筛选嵌入网站" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部网站</SelectItem>
          {sites.map((site) => (
            <SelectItem key={site.id} value={String(site.id)}>
              {site.site_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
