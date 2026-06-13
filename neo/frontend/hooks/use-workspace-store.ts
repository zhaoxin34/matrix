/**
 * Workspace Store
 * 使用 Zustand 管理全局 workspace 状态
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace } from "@/lib/api/workspace";
import { getWorkspaceList } from "@/lib/api/workspace";

// ============================================================
// Types
// ============================================================

interface WorkspaceState {
	/** 当前选中的工作区 ID */
	currentWorkspaceId: number | null;
	/** 当前选中的工作区对象 */
	currentWorkspace: Workspace | null;
	/** 当前组织下的工作区列表 */
	workspaces: Workspace[];
	/** 是否有 org_id（未选择 org 时无法加载工作区） */
	hasOrgId: boolean;
	/** 是否正在加载 */
	isLoading: boolean;
	/** 是否有错误 */
	error: Error | null;

	// Actions
	/** 设置当前工作区 ID（只设置 ID，不更新对象，由 loadWorkspaces 更新对象） */
	setCurrentWorkspaceId: (id: number | null) => void;
	/** 加载工作区列表 */
	loadWorkspaces: (orgId: number | null) => Promise<void>;
	/** 清除工作区状态 */
	clear: () => void;
}

// ============================================================
// Store
// ============================================================

export const useWorkspaceStore = create<WorkspaceState>()(
	persist(
		(set, get) => ({
			currentWorkspaceId: null,
			currentWorkspace: null,
			workspaces: [],
			hasOrgId: false,
			isLoading: false,
			error: null,

			// Actions
			// 设置当前工作区 ID
			setCurrentWorkspaceId: (id: number | null) => {
				const { workspaces } = get();
				const workspace = id
					? (workspaces.find((w) => w.id === id) ?? null)
					: null;
				set({ currentWorkspaceId: id, currentWorkspace: workspace });
			},

			// 加载工作区列表
			loadWorkspaces: async (orgId: number | null) => {
				if (!orgId) {
					set({
						workspaces: [],
						currentWorkspace: null,
						currentWorkspaceId: null,
						hasOrgId: false,
					});
					return;
				}

				set({ isLoading: true, error: null, hasOrgId: true });
				try {
					const result = await getWorkspaceList({ org_id: orgId });
					const { currentWorkspaceId } = get();

					// 如果当前工作区不在新列表中，重置为第一个
					const newCurrentWorkspace =
						currentWorkspaceId &&
						result.list.some((w) => w.id === currentWorkspaceId)
							? (result.list.find((w) => w.id === currentWorkspaceId) ?? null)
							: (result.list[0] ?? null);
					const newCurrentWorkspaceId = newCurrentWorkspace?.id ?? null;

					set({
						workspaces: result.list,
						currentWorkspace: newCurrentWorkspace,
						currentWorkspaceId: newCurrentWorkspaceId,
						isLoading: false,
					});
				} catch (err) {
					const error =
						err instanceof Error ? err : new Error("加载工作区失败");
					set({ error, isLoading: false });
					console.error("Failed to load workspaces:", err);
				}
			},

			// 清除
			clear: () => {
				set({
					currentWorkspaceId: null,
					currentWorkspace: null,
					workspaces: [],
					hasOrgId: false,
					error: null,
				});
			},
		}),
		{
			name: "neo-workspace",
			partialize: (state) => ({
				currentWorkspaceId: state.currentWorkspaceId,
			}),
		},
	),
);

// ============================================================
// Hooks
// ============================================================

/**
 * 使用 Workspace Store
 */
export function useWorkspace() {
	const store = useWorkspaceStore();
	return store;
}
