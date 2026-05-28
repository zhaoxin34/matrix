import type { OrgUnitTreeItem, EmployeeResponse } from "@/types/organization";
import {
  ApartmentIcon,
  GroupIcon,
  CheckCircleIcon,
  HourglassIcon,
} from "./icons";

interface DashboardStatsProps {
  orgTree: OrgUnitTreeItem[];
  employees: EmployeeResponse[];
  total: number;
}

function countOrgUnits(nodes: OrgUnitTreeItem[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children.length > 0) {
      count += countOrgUnits(node.children);
    }
  }
  return count;
}

export function DashboardStats({
  orgTree,
  employees,
  total,
}: DashboardStatsProps) {
  const stats = {
    org_count: countOrgUnits(orgTree),
    total,
    on_job: employees.filter((e) => e.status === "on_job").length,
    onboarding: employees.filter((e) => e.status === "onboarding").length,
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="flex flex-col items-center p-4 bg-card border">
        <ApartmentIcon className="h-8 w-8 text-primary mb-2" />
        <span className="text-3xl font-bold text-primary">
          {stats.org_count}
        </span>
        <span className="text-sm text-muted-foreground">组织单元</span>
      </div>
      <div className="flex flex-col items-center p-4 bg-card border">
        <GroupIcon className="h-8 w-8 text-green-600 mb-2" />
        <span className="text-3xl font-bold text-green-600">{stats.total}</span>
        <span className="text-sm text-muted-foreground">员工总数</span>
      </div>
      <div className="flex flex-col items-center p-4 bg-card border">
        <CheckCircleIcon className="h-8 w-8 text-blue-600 mb-2" />
        <span className="text-3xl font-bold text-blue-600">{stats.on_job}</span>
        <span className="text-sm text-muted-foreground">在职</span>
      </div>
      <div className="flex flex-col items-center p-4 bg-card border">
        <HourglassIcon className="h-8 w-8 text-yellow-600 mb-2" />
        <span className="text-3xl font-bold text-yellow-600">
          {stats.onboarding}
        </span>
        <span className="text-sm text-muted-foreground">入职中</span>
      </div>
    </div>
  );
}
