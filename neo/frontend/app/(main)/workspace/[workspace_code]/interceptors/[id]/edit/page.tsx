"use client";

import { useEffect, useState } from "react";
import { InterceptorForm } from "@/components/interceptor";
import { getInterceptor } from "@/lib/api/interceptors";
import { listEmbeddedSites } from "@/lib/api/embedded-sites";
import type { Interceptor } from "@/components/interceptor/interceptor-types";

interface EditInterceptorPageProps {
  params: Promise<{
    workspace_code: string;
    id: string;
  }>;
}

export default function EditInterceptorPage({
  params,
}: EditInterceptorPageProps) {
  const [workspaceCode, setWorkspaceCode] = useState<string>("");
  const [interceptor, setInterceptor] = useState<Interceptor | null>(null);
  const [sites, setSites] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      setWorkspaceCode(p.workspace_code);

      try {
        const [interceptorRes, sitesRes] = await Promise.all([
          getInterceptor(p.workspace_code, Number(p.id)),
          listEmbeddedSites(p.workspace_code),
        ]);
        setInterceptor(interceptorRes);
        setSites(
          (sitesRes.list || []).map((s: { id: number; site_name: string }) => ({
            id: s.id,
            name: s.site_name,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch interceptor:", error);
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">编辑拦截器</h1>
        <p className="text-muted-foreground">修改拦截器配置</p>
      </div>
      <InterceptorForm
        workspaceCode={workspaceCode}
        interceptor={interceptor}
        sites={sites}
        mode="edit"
      />
    </div>
  );
}
