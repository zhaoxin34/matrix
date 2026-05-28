import type { EmployeeStatus } from "@/types/organization";

export type TransitionAction = {
  key: string;
  label: string;
  targetStatus: EmployeeStatus;
};

export const statusLabels: Record<EmployeeStatus, string> = {
  onboarding: "入职中",
  on_job: "在职",
  transferring: "调动中",
  offboarding: "离职",
};

export const transitionMap: Record<EmployeeStatus, TransitionAction[]> = {
  onboarding: [{ key: "complete", label: "完成入职", targetStatus: "on_job" }],
  on_job: [
    { key: "transfer", label: "发起调动", targetStatus: "transferring" },
    { key: "offboard", label: "发起离职", targetStatus: "offboarding" },
  ],
  transferring: [
    { key: "complete_transfer", label: "完成调动", targetStatus: "on_job" },
    { key: "cancel_transfer", label: "取消调动", targetStatus: "on_job" },
  ],
  offboarding: [
    { key: "rejoin", label: "重新入职", targetStatus: "onboarding" },
  ],
};

export function getAvailableActions(
  status: EmployeeStatus,
): TransitionAction[] {
  return transitionMap[status] || [];
}

export function getStatusLabel(status: EmployeeStatus): string {
  return statusLabels[status] || status;
}
