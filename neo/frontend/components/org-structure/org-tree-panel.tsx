"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { OrgUnitTreeItem } from "@/types/organization";
import { OrgTreeNode } from "./org-tree-node";
import { LoaderIcon, PlusIcon } from "./icons";

interface OrgTreePanelProps {
  orgTree: OrgUnitTreeItem[];
  selectedId: number | null;
  isLoading: boolean;
  onSelect: (node: OrgUnitTreeItem) => void;
  onAddChild: (node: OrgUnitTreeItem) => void;
  onEdit: (node: OrgUnitTreeItem) => void;
  onDelete: (node: OrgUnitTreeItem) => void;
  onToggleStatus: (node: OrgUnitTreeItem) => void;
  onAddRoot: () => void;
}

export function OrgTreePanel({
  orgTree,
  selectedId,
  isLoading,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddRoot,
}: OrgTreePanelProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="w-96 min-w-96 bg-card border flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-semibold">组织结构</h3>
        <Button size="sm" variant="ghost" onClick={onAddRoot}>
          <PlusIcon className="h-4 w-4 mr-1" />
          新增
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderIcon className="h-6 w-6 text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              加载中...
            </span>
          </div>
        ) : orgTree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无组织数据
          </div>
        ) : (
          <div className="space-y-0.5">
            {orgTree.map((node) => (
              <OrgTreeNode
                key={node.id}
                node={node}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onHoverChange={setHoveredId}
                onSelect={onSelect}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
