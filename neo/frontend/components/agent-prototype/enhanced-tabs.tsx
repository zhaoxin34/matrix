"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabItem {
  key: string;
  label: string;
  desc?: string;
}

interface EnhancedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tab: string) => void;
}

/**
 * Enhanced Tabs - 带图标的 Tabs 组件
 * 目前使用基础 Tabs 实现，暂不添加图标
 */
export function EnhancedTabs({ tabs, activeTab, onChange }: EnhancedTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onChange} className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
