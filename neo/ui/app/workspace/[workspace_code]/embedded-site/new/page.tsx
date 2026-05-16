/**
 * Create Embedded Site Page
 *
 * 路由: /workspace/{workspace_code}/new
 * 功能: 创建新的 embedded-site
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmbeddedSiteForm } from "@/components/embedded-site";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

interface NewEmbeddedSitePageProps {
  params: Promise<{
    workspace_code: string;
  }>;
}

export default async function NewEmbeddedSitePage({
  params,
}: NewEmbeddedSitePageProps) {
  const { workspace_code } = await params;

  // TODO: 根据 workspace_code 获取 workspace_id
  const workspaceId = 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/workspace/${workspace_code}/list`}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={1.5}
              className="size-4 mr-1"
            />
            返回
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-heading font-medium">创建嵌入网站</h1>
          <p className="text-xs text-muted-foreground mt-1">
            添加一个可以被 Agent 嵌入和学习的网站
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl">
        <EmbeddedSiteForm
          submitLabel="创建"
          onSubmit={async (data) => {
            "use server";
            // TODO: 调用 API 创建
            console.log("Creating embedded site:", data);
            toast.success("嵌入网站创建成功");
          }}
          onCancel={() => {
            // Router back handled client-side
          }}
        />
      </div>
    </div>
  );
}