"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Bot,
	CheckCircle,
	ChevronDown,
	Home,
	ListTodo,
	LucideIcon,
	User2,
	Video,
	FolderBookmarkIcon,
	PlusIcon,
} from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workspace } from "./workspace/workspace-types";

// 菜单项类型
type MenuItem = {
	title: string;
	url?: string;
	icon?: LucideIcon;
	items?: MenuItem[];
};

// 菜单分组类型
type MenuGroup = {
	label?: string;
	items: MenuItem[];
};

// 基础菜单配置
const baseMenuGroups: MenuGroup[] = [
	{
		label: "个人中心",
		items: [
			{
				title: "我的 Agents",
				url: "/agents",
				icon: Bot,
			},
			{
				title: "我的任务",
				url: "/tasks",
				icon: ListTodo,
			},
			{
				title: "我的录像",
				url: "/recordings",
				icon: Video,
			},
		],
	},
	{
		label: "系统管理",
		items: [
			{
				title: "工作区管理",
				url: "/admin/workspace",
				icon: FolderBookmarkIcon,
			},
			{
				title: "组织管理",
				url: "/admin/org-structure",
				icon: Home,
			},
			{
				title: "用户管理",
				url: "/admin/users",
				icon: User2,
			},
			{
				title: "Agent 管理",
				url: "/admin/agents",
				icon: Bot,
			},
			{
				title: "Skills 管理",
				url: "/admin/skills",
				icon: CheckCircle,
			},
		],
	},
];

// 递归渲染菜单项（接收 pathname 作为参数）
function renderMenuItem(
	item: MenuItem,
	depth: number = 0,
	pathname: string = "",
): React.ReactNode {
	const hasChildren = item.items && item.items.length > 0;
	const Icon = item.icon;

	if (hasChildren) {
		return (
			<Collapsible key={item.title} defaultOpen={depth === 0}>
				<SidebarMenuItem>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton>
							{Icon && <Icon className="h-4 w-4" />}
							<span>{item.title}</span>
							<ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
						</SidebarMenuButton>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<SidebarMenuSub>
							{item.items!.map((subItem) => (
								<SidebarMenuSubItem key={subItem.title}>
									<SidebarMenuSubButton
										asChild
										isActive={
											subItem.url ? pathname.startsWith(subItem.url) : false
										}
									>
										<Link href={subItem.url || "#"}>
											{subItem.icon && <subItem.icon className="h-4 w-4" />}
											<span>{subItem.title}</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							))}
						</SidebarMenuSub>
					</CollapsibleContent>
				</SidebarMenuItem>
			</Collapsible>
		);
	}

	const isActive = item.url
		? pathname === item.url || pathname.startsWith(item.url + "/")
		: false;

	return (
		<SidebarMenuItem key={item.title}>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link href={item.url || "#"}>
					{Icon && <Icon className="h-4 w-4" />}
					<span>{item.title}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

// 动态 Workspace 菜单组件
function WorkspaceMenu() {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [loading, setLoading] = useState(true);
	const [isOpen, setIsOpen] = useState(true);
	const pathname = usePathname();

	useEffect(() => {
		const fetchWorkspaces = async () => {
			try {
				const response = await fetch("/api/v1/workspaces?status=active");
				const result = await response.json();

				if (result.code === 0) {
					setWorkspaces(result.data?.list || []);
				}
			} catch (error) {
				console.error("Failed to fetch workspaces:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchWorkspaces();
	}, []);

	// Mock data for demonstration
	const mockWorkspaces: Workspace[] = [
		{
			id: 1,
			name: "CRM 工作区",
			code: "crm-workspace",
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
			status: "active",
			org_id: 1,
			owner_id: 1,
			member_count: 8,
			project_count: 5,
			created_at: "2026-04-15T08:00:00Z",
			updated_at: "2026-05-10T12:00:00Z",
		},
	];

	const displayWorkspaces = loading
		? []
		: workspaces.length > 0
			? workspaces
			: mockWorkspaces;

	return (
		<Collapsible defaultOpen={true} open={isOpen} onOpenChange={setIsOpen}>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton>
						<FolderBookmarkIcon className="h-4 w-4" />
						<span>工作区</span>
						<ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
			</SidebarMenuItem>
			<CollapsibleContent>
				<SidebarMenuSub>
					{loading ? (
						<>
							<SidebarMenuSubItem>
								<Skeleton className="h-7 w-full" />
							</SidebarMenuSubItem>
							<SidebarMenuSubItem>
								<Skeleton className="h-7 w-full" />
							</SidebarMenuSubItem>
						</>
					) : (
						<>
							{displayWorkspaces.map((workspace) => (
								<SidebarMenuSubItem key={workspace.id}>
									<SidebarMenuSubButton
										asChild
										isActive={
											pathname === `/admin/workspace/${workspace.id}` ||
											pathname.startsWith(`/admin/workspace/${workspace.id}/`)
										}
									>
										<Link href={`/admin/workspace/${workspace.id}`}>
											<span className="truncate">{workspace.name}</span>
										</Link>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							))}
							<SidebarMenuSubItem>
								<SidebarMenuSubButton asChild>
									<Link href="/admin/workspace/new">
										<PlusIcon className="h-4 w-4" />
										<span>新建工作区</span>
									</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						</>
					)}
				</SidebarMenuSub>
			</CollapsibleContent>
		</Collapsible>
	);
}

// 导出菜单配置（供外部使用）
export { baseMenuGroups };

export function SidebarContentComponent() {
	const pathname = usePathname();

	return (
		<SidebarContent>
			{/* 个人中心 */}
			<SidebarGroup>
				<SidebarGroupLabel>个人中心</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{baseMenuGroups[0].items.map((item) =>
							renderMenuItem(item, 0, pathname),
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			{/* 工作区 */}
			<SidebarGroup>
				<SidebarGroupLabel>工作区</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						<WorkspaceMenu />
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			{/* 系统管理 */}
			<SidebarGroup>
				<SidebarGroupLabel>系统管理</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{baseMenuGroups[1].items.map((item) =>
							renderMenuItem(item, 0, pathname),
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	);
}
