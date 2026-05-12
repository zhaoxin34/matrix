"use client";

import {
  Sidebar,
  SidebarRail,
} from "@/components/ui/sidebar";

import { SidebarHeaderComponent } from "./sidebar-header";
import { SidebarContentComponent } from "./sidebar-content";
import { SidebarFooterComponent } from "./sidebar-footer";

// 主 Sidebar 组件
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeaderComponent />
      <SidebarContentComponent />
      <SidebarFooterComponent />
      <SidebarRail />
    </Sidebar>
  );
}
