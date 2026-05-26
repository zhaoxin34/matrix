"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon, Globe02Icon } from "@hugeicons/core-free-icons";
import { EmbeddedSiteStatusBadge } from "./embedded-site-status-badge";
import type { EmbeddedSite } from "./embedded-site-types";

interface EmbeddedSiteCardProps {
	site: EmbeddedSite;
	workspaceCode: string;
	onStatusChange?: (site: EmbeddedSite) => void;
	className?: string;
}

export function EmbeddedSiteCard({
	site,
	workspaceCode,
	className,
}: EmbeddedSiteCardProps) {
	return (
		<Card className={className}>
			<CardContent className="p-4 space-y-3">
				<div className="flex items-start justify-between gap-2">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<HugeiconsIcon
								icon={Globe02Icon}
								strokeWidth={1.5}
								className="size-4 text-muted-foreground shrink-0"
							/>
							<h3 className="font-medium text-sm truncate">{site.site_name}</h3>
						</div>
						<p className="text-sm text-muted-foreground mt-1 truncate">
							{site.site_url}
						</p>
					</div>
					<EmbeddedSiteStatusBadge status={site.status} />
				</div>

				{site.description && (
					<p className="text-sm text-muted-foreground line-clamp-2">
						{site.description}
					</p>
				)}

				<div className="flex items-center gap-2 pt-2 border-t">
					<Button variant="ghost" size="sm" className="h-7 text-sm" asChild>
						<Link
							href={`/workspace/${workspaceCode}/embedded-site/${site.id}/edit`}
						>
							<HugeiconsIcon
								icon={Settings01Icon}
								strokeWidth={1.5}
								className="size-3 mr-1"
							/>
							编辑
						</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
