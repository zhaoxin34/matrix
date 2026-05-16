/**
 * Edit Embedded Site Page
 *
 * 路由: /workspace/{workspace_code}/embedded-site/{id}/edit
 * 功能: 修改 embedded-site
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditEmbeddedSiteForm } from "@/components/embedded-site";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete01Icon } from "@hugeicons/core-free-icons";

interface EditEmbeddedSitePageProps {
	params: Promise<{
		workspace_code: string;
		id: string;
	}>;
}

// Mock data - 实际应从 API 获取
const mockSites: Record<
	string,
	{
		id: number;
		site_name: string;
		site_url: string;
		description: string;
		status: "enabled" | "disabled";
	}
> = {
	"1": {
		id: 1,
		site_name: "示例电商网站",
		site_url: "https://example-ecommerce.com",
		description: "这是一个示例电商网站，用于测试 Agent 嵌入功能",
		status: "enabled",
	},
	"2": {
		id: 2,
		site_name: "测试网站",
		site_url: "https://test-site.com",
		description: "",
		status: "disabled",
	},
};

export default async function EditEmbeddedSitePage({
	params,
}: EditEmbeddedSitePageProps) {
	const { workspace_code, id } = await params;

	// TODO: 根据 id 从 API 获取数据
	const site = mockSites[id];

	if (!site) {
		notFound();
	}

	// TODO: 根据 workspace_code 获取 workspace_id
	const workspaceId = 1;

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
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
						<h1 className="text-xl font-heading font-medium">编辑嵌入网站</h1>
						<p className="text-xs text-muted-foreground mt-1">
							修改嵌入网站的配置信息
						</p>
					</div>
				</div>

				{/* Delete Button */}
				<Button
					variant="outline"
					size="sm"
					className="text-destructive hover:text-destructive"
				>
					<HugeiconsIcon
						icon={Delete01Icon}
						strokeWidth={1.5}
						className="size-4 mr-1"
					/>
					删除
				</Button>
			</div>

			{/* Form */}
			<div className="max-w-xl">
				<Card>
					<CardContent className="pt-6">
						<EditEmbeddedSiteForm
							siteId={id}
							workspaceId={workspaceId}
							initialData={{
								site_name: site.site_name,
								site_url: site.site_url,
								description: site.description,
								status: site.status,
							}}
							successUrl={`/workspace/${workspace_code}/list`}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
