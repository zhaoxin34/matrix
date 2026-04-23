import apiClient from "../axios";
import type { ApiResponse } from "../types";
import type { OrgDashboard } from "@/types/org";

export const orgDashboardApi = {
  getDashboard: async (): Promise<OrgDashboard> => {
    const res =
      await apiClient.get<ApiResponse<OrgDashboard>>("/org/dashboard");
    return res.data.data!;
  },
};
