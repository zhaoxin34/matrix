"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppHeader } from "@/components/header";
import { useOrganizationStore } from "@/hooks/use-organization-store";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 初始化加载 organization 数据
  useEffect(() => {
    const store = useOrganizationStore.getState();
    store.loadOrgUnits();
  }, []);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="flex-1 p-6 min-w-0 overflow-x-hidden">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
