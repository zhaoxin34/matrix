/**
 * Organization Store
 * 使用 Zustand 管理全局 org 状态
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrgUnitResponse } from "@/types/organization";
import { getRootOrgUnits } from "@/lib/api/organization";

// ============================================================
// Types
// ============================================================

interface OrganizationState {
	/** 当前选中的组织 ID */
	selectedOrgId: number | null;
	/** 当前选中的组织信息 */
	selectedOrg: OrgUnitResponse | null;
	/** 所有根级组织列表 */
	orgUnits: OrgUnitResponse[];
	/** 是否正在加载 */
	isLoading: boolean;
	/** 是否有错误 */
	error: Error | null;

	// Actions
	/** 设置选中的组织 ID */
	setSelectedOrgId: (id: number) => void;
	/** 加载组织列表 */
	loadOrgUnits: () => Promise<void>;
	/** 刷新组织列表 */
	refresh: () => Promise<void>;
}

// ============================================================
// Store
// ============================================================

export const useOrganizationStore = create<OrganizationState>()(
	persist(
		(set, get) => ({
			selectedOrgId: null,
			selectedOrg: null,
			orgUnits: [],
			isLoading: false,
			error: null,

			// 设置选中的组织 ID
			setSelectedOrgId: (id: number) => {
				const { orgUnits } = get();
				const selectedOrg = orgUnits.find((unit) => unit.id === id) ?? null;
				set({ selectedOrgId: id, selectedOrg });
			},

			// 加载组织列表
			loadOrgUnits: async () => {
				set({ isLoading: true, error: null });
				try {
					const units = await getRootOrgUnits("active");
					const { selectedOrgId } = get();

					// 如果没有设置默认 org_id，自动选择第一个
					if (units.length > 0) {
						const newSelectedOrgId = selectedOrgId ?? units[0].id;
						const newSelectedOrg =
							units.find((u) => u.id === newSelectedOrgId) ?? units[0];
						set({
							orgUnits: units,
							selectedOrgId: newSelectedOrgId,
							selectedOrg: newSelectedOrg,
							isLoading: false,
						});
					} else {
						set({ orgUnits: units, isLoading: false });
					}
				} catch (err) {
					const error = err instanceof Error ? err : new Error("加载组织失败");
					set({ error, isLoading: false });
					console.error("Failed to load org units:", err);
				}
			},

			// 刷新
			refresh: async () => {
				await get().loadOrgUnits();
			},
		}),
		{
			name: "neo-organization",
			// 只持久化 selectedOrgId，其他（orgUnits/selectedOrg/error 等）从服务端重新加载
			partialize: (state) => ({
				selectedOrgId: state.selectedOrgId,
			}),
		},
	),
);

// ============================================================
// Hooks (简化用法)
// ============================================================

/**
 * 使用 Organization Store
 */
export function useOrganization() {
	const store = useOrganizationStore();
	return store;
}
