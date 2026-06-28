"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { EmbeddedSiteForm } from "@/components/embedded-site";
import { createEmbeddedSite } from "@/lib/api/embedded-sites";
import type { CreateEmbeddedSiteInput } from "@/components/embedded-site";

interface NewEmbeddedSitePageProps {
	params: Promise<{
		workspace_code: string;
	}>;
}

export default function NewEmbeddedSitePage({
	params,
}: NewEmbeddedSitePageProps) {
	const [workspaceCode, setWorkspaceCode] = useState<string>("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		params.then((p) => setWorkspaceCode(p.workspace_code));
	}, [params]);

	const handleSubmit = async (data: CreateEmbeddedSiteInput) => {
		if (!workspaceCode) return;
		setLoading(true);
		try {
			await createEmbeddedSite(workspaceCode, data);
			toast.success("嵌入网站创建成功");
			window.location.href = `/workspace/${workspaceCode}/embedded-sites`;
		} catch (error) {
			toast.error(String(error));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		window.history.back();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="sm" asChild>
					<Link href={`/workspace/${workspaceCode}/embedded-sites`}>
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

			<div className="max-w-xl">
				<EmbeddedSiteForm
					submitLabel="创建"
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					loading={loading}
				/>
			</div>
		</div>
	);
}
