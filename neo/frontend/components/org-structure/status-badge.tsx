import { Badge } from "@/components/ui/badge";
import type { EmployeeStatus } from "@/types/organization";

const config: Record<EmployeeStatus, { label: string; className: string }> = {
  onboarding: { label: "入职中", className: "bg-blue-100 text-blue-800" },
  on_job: { label: "在职", className: "bg-green-100 text-green-800" },
  transferring: { label: "调动中", className: "bg-yellow-100 text-yellow-800" },
  offboarding: { label: "离职", className: "bg-red-100 text-red-800" },
};

const deletedConfig = {
  label: "已删除",
  className: "bg-gray-100 text-gray-500",
};

export function StatusBadge({
  status,
  isDeleted,
}: {
  status: EmployeeStatus;
  isDeleted?: boolean;
}) {
  if (isDeleted) {
    return (
      <Badge className={deletedConfig.className}>{deletedConfig.label}</Badge>
    );
  }
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}
