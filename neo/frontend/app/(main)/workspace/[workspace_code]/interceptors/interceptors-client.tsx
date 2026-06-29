"use client";

import { useEffect, useState } from "react";
import { InterceptorList } from "@/components/interceptor";
import { getInterceptors } from "@/lib/api/interceptors";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";
import type { Interceptor } from "@/components/interceptor/interceptor-types";

interface InterceptorsClientProps {
  workspaceCode: string;
}

export function InterceptorsClient({ workspaceCode }: InterceptorsClientProps) {
  const [initialData, setInitialData] = useState<{
    items: Interceptor[];
    total: number;
    page: number;
    page_size: number;
  }>({
    items: [],
    total: 0,
    page: 1,
    page_size: 50,
  });
  const [sites, setSites] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [interceptorsRes, sitesRes] = await Promise.all([
          getInterceptors(workspaceCode, { page_size: 50 }),
          listEmbeddedSites(workspaceCode),
        ]);
        setInitialData(interceptorsRes);
        setSites(
          (sitesRes.list || []).map((s: { id: number; site_name: string }) => ({
            id: s.id,
            name: s.site_name,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [workspaceCode]);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <InterceptorList
      workspaceCode={workspaceCode}
      initialData={initialData}
      sites={sites}
    />
  );
}
