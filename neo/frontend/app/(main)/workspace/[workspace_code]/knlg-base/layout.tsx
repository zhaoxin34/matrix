"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function KnlgBaseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams();
	const workspaceCode = params.workspace_code as string;
	const pathname = usePathname();

	const nav = [
		{ label: "首页", href: `/workspace/${workspaceCode}/knlg-base` },
		{ label: "问答库", href: `/workspace/${workspaceCode}/knlg-base/qa` },
		{
			label: "知识库",
			href: `/workspace/${workspaceCode}/knlg-base/knowledge`,
		},
		{ label: "规则库", href: `/workspace/${workspaceCode}/knlg-base/rules` },
		{ label: "知识导入", href: `/workspace/${workspaceCode}/knlg-base/import` },
	];

	return (
		<div className="flex">
			<aside className="w-48 border-r min-h-screen p-4">
				<h2 className="font-bold mb-4 text-sm">知识库与问答库</h2>
				<nav className="space-y-1">
					{nav.map((item) => {
						const active =
							pathname === item.href || pathname.startsWith(item.href + "/");
						return (
							<Link
								key={item.href}
								href={item.href as `/${string}`}
								className={cn(
									"block px-3 py-2 rounded text-sm transition-colors",
									active
										? "bg-accent text-accent-foreground font-medium"
										: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
								)}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>
			</aside>
			<main className="flex-1 p-6">{children}</main>
		</div>
	);
}
