"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface InterceptorHeaderProps {
  workspaceCode: string;
}

export function InterceptorHeader({ workspaceCode }: InterceptorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">拦截器管理</h1>
        <p className="text-muted-foreground">配置和管理拦截器规则</p>
      </div>
      <Button asChild>
        <Link href={`/workspace/${workspaceCode}/interceptors/new`}>
          <Plus className="mr-2 h-4 w-4" />
          创建拦截器
        </Link>
      </Button>
    </div>
  );
}
