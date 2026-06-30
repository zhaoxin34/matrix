"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<
	string,
	"default" | "secondary" | "outline" | "destructive"
> = {
	draft: "outline",
	reviewing: "secondary",
	published: "default",
	deprecated: "destructive",
	pending: "outline",
	in_progress: "secondary",
	answered: "default",
	archived: "destructive",
	testing: "secondary",
	active: "default",
	paused: "outline",
	pending_validation: "outline",
	validated: "default",
	auto_published: "default",
	partially_validated: "secondary",
	pending_action: "outline",
};

export function StatusBadge({ status }: { status: string }) {
	return (
		<Badge variant={STATUS_VARIANT[status] || "outline"}>
			{status.replace(/_/g, " ")}
		</Badge>
	);
}
