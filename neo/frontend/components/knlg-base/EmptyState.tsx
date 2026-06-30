"use client";

export function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
			{description && (
				<p className="text-sm text-muted-foreground mt-1">{description}</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
