"use client";

import { useEffect, useState } from "react";
import { InterceptorForm } from "@/components/interceptor";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";
import { useParams } from "next/navigation";

export default function NewInterceptorPage() {
  const params = useParams();
  const workspace_code = params.workspace_code as string;
  const [sites, setSites] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSites() {
      try {
        const sitesRes = await listEmbeddedSites(workspace_code);
        setSites(
          (sitesRes.list || []).map((s: { id: number; site_name: string }) => ({
            id: s.id,
            name: s.site_name,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSites();
  }, [workspace_code]);

  if (loading) {
    return <div className="container py-6">Loading...</div>;
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">创建拦截器</h1>
        <p className="text-muted-foreground">配置新的拦截器规则</p>
      </div>
      <InterceptorForm
        workspaceCode={workspace_code}
        sites={sites}
        mode="create"
      />
    </div>
  );
}
