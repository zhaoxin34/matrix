"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Bot,
	Globe,
	Home,
	ListTodo,
	LucideIcon,
	User2,
	Video,
	FolderBookmarkIcon,
} from "lucide-react";

import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

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
				title: "工作区管理",
				url: "/admin/workspace",
				icon: FolderBookmarkIcon,
			},

			{
				title: "Agent 原型管理",
				url: "/admin/agent-prototype",
				icon: Bot,
			},
		],
	},
];

// 递归渲染菜单项
function renderMenuItem(
	item: MenuItem,
	_pathname: string = "",
): React.ReactNode {
	const Icon = item.icon;

	const isActive = item.url
		? _pathname === item.url || _pathname.startsWith(item.url + "/")
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

// TODO: workspace_code 应从 workspace switcher 动态获取，目前使用默认占位符
const defaultWorkspaceCode = "demo";

// 工作区菜单项 - 直接作为一级菜单
const workspaceMenuItems: MenuItem[] = [
	{
		title: "嵌入网站管理",
		url: `/workspace/${defaultWorkspaceCode}/list`,
		icon: Globe,
	},
	{
		title: "Agent 管理",
		url: `/workspace/${defaultWorkspaceCode}/agents`,
		icon: Bot,
	},
];

// 导出菜单配置（供外部使用）
export { baseMenuGroups, workspaceMenuItems };

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
							renderMenuItem(item, pathname),
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			{/* 工作区菜单 */}
			<SidebarGroup>
				<SidebarGroupLabel>工作区</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{workspaceMenuItems.map((item) => renderMenuItem(item, pathname))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			{/* 系统管理 */}
			<SidebarGroup>
				<SidebarGroupLabel>系统管理</SidebarGroupLabel>
				<SidebarGroupContent>
					<SidebarMenu>
						{baseMenuGroups[1].items.map((item) =>
							renderMenuItem(item, pathname),
						)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	);
}
