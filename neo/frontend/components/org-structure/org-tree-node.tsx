import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { OrgUnitTreeItem } from "@/types/organization";
import {
  BuildingIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  EditIcon,
  MoreIcon,
  PlusIcon,
  BlockIcon,
} from "./icons";

interface OrgTreeNodeProps {
  node: OrgUnitTreeItem;
  selectedId: number | null;
  hoveredId: number | null;
  onHoverChange: (id: number | null) => void;
  onSelect: (node: OrgUnitTreeItem) => void;
  onAddChild: (node: OrgUnitTreeItem) => void;
  onEdit: (node: OrgUnitTreeItem) => void;
  onDelete: (node: OrgUnitTreeItem) => void;
  onToggleStatus: (node: OrgUnitTreeItem) => void;
}

export function OrgTreeNode({
  node,
  selectedId,
  hoveredId,
  onHoverChange,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  onToggleStatus,
}: OrgTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div
      className="group"
      onMouseEnter={() => onHoverChange(node.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer hover:bg-accent transition-colors",
          isSelected && "bg-primary text-primary-foreground",
        )}
        onClick={() => onSelect(node)}
      >
        <div className="w-5 flex items-center justify-center flex-shrink-0">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-1 border rounded hover:bg-accent transition-colors"
            >
              {isOpen ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-2 h-2 rounded-none border-2 border-muted-foreground" />
          )}
        </div>
        <BuildingIcon className="h-4 w-4 flex-shrink-0 opacity-60" />
        <span className="flex-1 truncate text-sm font-medium">{node.name}</span>
        <Badge
          variant={isSelected ? "default" : "secondary"}
          className="h-5 text-xs"
        >
          {node.total_member_count || 0}人
        </Badge>
        {/* 操作按钮 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "p-1 border rounded transition-opacity",
                hoveredId === node.id ? "opacity-100" : "opacity-0",
              )}
            >
              <MoreIcon className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onAddChild(node)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              添加子节点
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <EditIcon className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(node)}>
              <BlockIcon className="mr-2 h-4 w-4" />
              {node.status === "active" ? "禁用" : "启用"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(node)}
              className="text-destructive"
            >
              <DeleteIcon className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="ml-4 border-l border-border pl-2">
          {node.children.map((child) => (
            <OrgTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onHoverChange={onHoverChange}
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
  );
}
