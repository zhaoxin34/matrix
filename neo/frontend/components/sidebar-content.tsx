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
  Layers,
  Info,
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
import { useWorkspaceStore } from "@/hooks/use-workspace-store";

// 菜单项类型
type MenuItem = {
  title: string;
  url?: string;
  icon?: LucideIcon;
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
      {
        title: "Skills 管理",
        url: "/admin/skills",
        icon: Layers,
      },
    ],
  },
];

type MenuGroup = {
  label?: string;
  items: MenuItem[];
};

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
      <SidebarMenuButton asChild isActive={isActive} className="text-sm">
        <Link href={item.url || "#"}>
          {Icon && <Icon className="h-4 w-4" />}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// 工作区菜单项 - 使用 workspace store 动态获取
function useWorkspaceMenuItems(): { items: MenuItem[]; showPrompt: boolean } {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  const hasOrgId = useWorkspaceStore((s) => s.hasOrgId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  // 未选择工作区时显示提示
  if (!hasOrgId || workspaces.length === 0) {
    return { items: [], showPrompt: true };
  }

  if (!currentWorkspace) {
    return { items: [], showPrompt: true };
  }

  // 使用当前工作区的 code
  return {
    items: [
      {
        title: "嵌入网站管理",
        url: `/workspace/${currentWorkspace.code}/embedded-sites`,
        icon: Globe,
      },
      {
        title: "Agent 管理",
        url: `/workspace/${currentWorkspace.code}/agents`,
        icon: Bot,
      },
    ],
    showPrompt: false,
  };
}

// 导出菜单配置（供外部使用）
export { baseMenuGroups };

export function SidebarContentComponent() {
  const pathname = usePathname();
  const { items: workspaceMenuItems, showPrompt } = useWorkspaceMenuItems();

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
        <SidebarGroupLabel className="text-sm">工作区</SidebarGroupLabel>
        <SidebarGroupContent>
          {showPrompt ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Info className="size-4 text-muted-foreground" />
              <span>请先选择一个工作区</span>
            </div>
          ) : (
            <SidebarMenu>
              {workspaceMenuItems.map((item) => renderMenuItem(item, pathname))}
            </SidebarMenu>
          )}
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
