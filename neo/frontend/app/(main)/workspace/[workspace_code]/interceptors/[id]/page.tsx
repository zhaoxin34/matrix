"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InterceptorDetail } from "@/components/interceptor";
import { getInterceptor } from "@/lib/api/interceptors";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";
import type { Interceptor } from "@/components/interceptor/interceptor-types";

export default function InterceptorDetailPage() {
  const params = useParams();
  const workspace_code = params.workspace_code as string;
  const id = params.id as string;

  const [interceptor, setInterceptor] = useState<Interceptor | null>(null);
  const [siteName, setSiteName] = useState<string>("未知站点");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [interceptorRes, sitesRes] = await Promise.all([
          getInterceptor(workspace_code, Number(id)),
          listEmbeddedSites(workspace_code),
        ]);
        setInterceptor(interceptorRes);

        // Find site name
        const allSites = sitesRes.list || [];
        const site = allSites.find(
          (s: { id: number }) => s.id === interceptorRes.embedded_site_id,
        );
        if (site) {
          setSiteName(site.site_name);
        }
      } catch (error) {
        console.error("Failed to fetch interceptor:", error);
      } finally {
        setLoading(false);
      }
    }
    if (workspace_code && id) {
      fetchData();
    }
  }, [workspace_code, id]);

  if (loading) {
    return <div className="container py-6">加载中...</div>;
  }

  if (!interceptor) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">未找到拦截器</h2>
          <p className="text-muted-foreground mt-2">拦截器不存在或已被删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <InterceptorDetail
        interceptor={interceptor}
        workspaceCode={workspace_code}
        siteName={siteName}
      />
    </div>
  );
}
