"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Search01Icon,
	Folder02Icon,
	ChevronRight,
} from "@hugeicons/core-free-icons";
import type { Workspace } from "@/components/workspace/workspace-types";

// Mock data for workspaces
const mockWorkspaces: Workspace[] = [
	{
		id: 1,
		name: "CRM 工作区",
		code: "crm-workspace",
		description: "客户关系管理团队的工作区",
		status: "active",
		org_id: 1,
		owner_id: 1,
		member_count: 15,
		project_count: 8,
		created_at: "2026-05-01T10:00:00Z",
		updated_at: "2026-05-12T15:30:00Z",
	},
	{
		id: 2,
		name: "运营工作区",
		code: "ops-workspace",
		description: "运营团队的工作区，负责日常运营任务",
		status: "active",
		org_id: 1,
		owner_id: 1,
		member_count: 8,
		project_count: 5,
		created_at: "2026-04-15T08:00:00Z",
		updated_at: "2026-05-10T12:00:00Z",
	},
	{
		id: 3,
		name: "产品研发工作区",
		code: "dev-workspace",
		description: "产品研发团队的工作区",
		status: "active",
		org_id: 1,
		owner_id: 1,
		member_count: 25,
		project_count: 12,
		created_at: "2026-03-10T09:00:00Z",
		updated_at: "2026-05-13T10:00:00Z",
	},
	{
		id: 4,
		name: "市场分析工作区",
		code: "marketing-workspace",
		description: "市场分析团队的工作区",
		status: "active",
		org_id: 1,
		owner_id: 1,
		member_count: 6,
		project_count: 3,
		created_at: "2026-04-20T14:00:00Z",
		updated_at: "2026-05-11T16:00:00Z",
	},
	{
		id: 5,
		name: "人力资源工作区",
		code: "hr-workspace",
		description: "人力资源团队的工作区",
		status: "disabled",
		org_id: 1,
		owner_id: 1,
		member_count: 4,
		project_count: 2,
		created_at: "2026-02-28T11:00:00Z",
		updated_at: "2026-05-08T09:00:00Z",
	},
];

interface WorkspaceSwitcherProps {
	currentWorkspaceId?: string;
}

export function WorkspaceSwitcher({
	currentWorkspaceId,
}: WorkspaceSwitcherProps) {
	const [open, setOpen] = useState(false);
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const router = useRouter();
	const pathname = usePathname();
	const inputRef = useRef<HTMLInputElement>(null);

	const fetchWorkspaces = useCallback(async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/v1/workspaces?status=active");
			const result = await response.json();

			if (result.code === 0) {
				setWorkspaces(result.data.list);
			} else {
				setWorkspaces(mockWorkspaces);
			}
		} catch {
			setWorkspaces(mockWorkspaces);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchWorkspaces();
	}, [fetchWorkspaces]);

	const displayWorkspaces = loading
		? []
		: workspaces.length > 0
			? workspaces
			: mockWorkspaces;

	const filteredWorkspaces = search.trim()
		? displayWorkspaces.filter(
				(ws) =>
					ws.name.toLowerCase().includes(search.toLowerCase()) ||
					ws.code.toLowerCase().includes(search.toLowerCase()) ||
					(ws.description &&
						ws.description.toLowerCase().includes(search.toLowerCase())),
			)
		: displayWorkspaces;

	const currentWorkspace = displayWorkspaces.find(
		(ws) => ws.id.toString() === currentWorkspaceId,
	);

	const handleSelectWorkspace = (workspace: Workspace) => {
		setOpen(false);
		setSearch("");
		router.push(`/admin/workspace/${workspace.id}`);
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setSearch("");
		}
	};

	const getPageTitle = () => {
		if (pathname === "/") return "首页";
		if (pathname.includes("/admin/workspace/new")) return "新建工作区";
		return "工作区 / 任务";
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="flex h-8 min-w-0 items-center gap-2 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs text-left transition-colors hover:bg-accent hover:text-accent-foreground"
			>
				<HugeiconsIcon
					icon={Folder02Icon}
					strokeWidth={1.5}
					className="size-4 shrink-0 text-muted-foreground"
				/>
				<span className="flex-1 truncate font-medium">
					{currentWorkspace?.name || getPageTitle()}
				</span>
				<HugeiconsIcon
					icon={ChevronRight}
					strokeWidth={1.5}
					className="size-3 shrink-0 rotate-90 text-muted-foreground"
				/>
			</button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="top-1/3 -translate-y-0 p-0">
					<DialogHeader className="border-b px-3 py-2">
						<DialogTitle className="text-xs font-medium text-muted-foreground">
							切换工作区
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col">
						<div className="flex items-center gap-2 border-b px-3 py-2">
							<HugeiconsIcon
								icon={Search01Icon}
								strokeWidth={2}
								className="size-4 shrink-0 opacity-50"
							/>
							<input
								ref={inputRef}
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="搜索工作区..."
								className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
								autoFocus
							/>
						</div>
						<div className="max-h-72 overflow-y-auto">
							{filteredWorkspaces.length === 0 ? (
								<div className="py-6 text-center">
									<HugeiconsIcon
										icon={Search01Icon}
										strokeWidth={1.5}
										className="size-8 text-muted-foreground/50 mx-auto mb-2"
									/>
									<p className="text-xs text-muted-foreground">
										未找到匹配的工作区
									</p>
								</div>
							) : (
								<div className="p-1">
									{filteredWorkspaces.map((workspace) => (
										<button
											key={workspace.id}
											onClick={() => handleSelectWorkspace(workspace)}
											className="flex w-full items-center justify-between rounded-none px-2 py-2 text-xs text-left transition-colors hover:bg-accent data-[selected=true]:bg-muted"
										>
											<div className="flex flex-col gap-0.5 min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-medium truncate">
														{workspace.name}
													</span>
													{workspace.status === "disabled" && (
														<span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
															已禁用
														</span>
													)}
													{workspace.id.toString() === currentWorkspaceId && (
														<span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
															当前
														</span>
													)}
												</div>
												<span className="text-[10px] text-muted-foreground font-mono truncate">
													{workspace.code}
												</span>
											</div>
											<div className="flex items-center gap-4 shrink-0 ml-4">
												<div className="flex items-center gap-3 text-[10px] text-muted-foreground">
													<span>{workspace.member_count} 成员</span>
													<span>{workspace.project_count} 项目</span>
												</div>
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

// Main header component for the app
export function AppHeader() {
	return (
		<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
			<SidebarTrigger />
			<WorkspaceSwitcher />
		</header>
	);
}
