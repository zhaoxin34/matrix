"use client";

import {
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Home,
  ListTodo,
  LucideIcon,
  User2,
  Video,
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

// 菜单配置
const menuGroups: MenuGroup[] = [
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
    label: "工作区",
    items: [
      {
        title: "CRM 工作区",
        icon: ChevronRight,
        items: [
          { title: "Agents", url: "/workspace/crm/agents", icon: Bot },
          { title: "任务", url: "/workspace/crm/tasks", icon: ListTodo },
          { title: "录像", url: "/workspace/crm/recordings", icon: Video },
        ],
      },
      {
        title: "运营工作区",
        icon: ChevronRight,
        items: [
          { title: "Agents", url: "/workspace/ops/agents", icon: Bot },
          { title: "任务", url: "/workspace/ops/tasks", icon: ListTodo },
        ],
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

// 递归渲染菜单项
function renderMenuItem(item: MenuItem, depth: number = 0): React.ReactNode {
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
                  <SidebarMenuSubButton asChild>
                    <a href={subItem.url || "#"}>
                      {subItem.icon && <subItem.icon className="h-4 w-4" />}
                      <span>{subItem.title}</span>
                    </a>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={false}>
        <a href={item.url || "#"}>
          {Icon && <Icon className="h-4 w-4" />}
          <span>{item.title}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// 导出菜单配置（供外部使用）
export { menuGroups };

export function SidebarContentComponent() {
  return (
    <SidebarContent>
      {menuGroups.map((group, index) => (
        <SidebarGroup key={group.label || `group-${index}`}>
          {group.label && (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => renderMenuItem(item, index))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
