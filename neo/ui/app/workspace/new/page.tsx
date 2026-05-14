"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Shield02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";

/**
 * User Create Workspace Page (Access Denied)
 * 
 * 路由: /workspace/new
 * 角色: 普通用户
 * 说明: 普通用户无权创建 Workspace，应使用 /admin/workspace/new
 */
export default function UserCreateWorkspacePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/workspace">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            返回工作区列表
          </Link>
        </Button>
        <h1 className="text-xl font-heading font-medium">创建工作区</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <HugeiconsIcon
            icon={Shield02Icon}
            strokeWidth={1.5}
            className="size-12 text-muted-foreground/50 mb-4"
          />
          <h3 className="text-sm font-medium mb-1">无权创建工作区</h3>
          <p className="text-xs text-muted-foreground mb-4 text-center max-w-md">
            创建工作区需要管理员权限。如果您需要创建工作区，请联系系统管理员。
          </p>
          <Button variant="outline" asChild>
            <Link href="/workspace">返回工作区列表</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}