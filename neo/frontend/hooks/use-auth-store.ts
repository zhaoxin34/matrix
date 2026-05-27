/**
 * Auth Store
 * Manages authentication state using Zustand
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
	user_id: number;
	username: string | null;
	token: string;
}

interface AuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;

	// Actions
	login: (user: AuthUser) => void;
	logout: () => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
	clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,

			login: (user: AuthUser) => {
				set({
					user,
					isAuthenticated: true,
					error: null,
				});
			},

			logout: () => {
				set({
					user: null,
					isAuthenticated: false,
					error: null,
				});
			},

			setLoading: (loading: boolean) => {
				set({ isLoading: loading });
			},

			setError: (error: string | null) => {
				set({ error });
			},

			clearError: () => {
				set({ error: null });
			},
		}),
		{
			name: "neo-auth",
			partialize: (state) => ({
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		},
	),
);

// ============================================================
// Auth Hooks
// ============================================================

/**
 * Check if user is authenticated
 */
export function useIsAuthenticated() {
	return useAuthStore((state) => state.isAuthenticated);
}

/**
 * Get current user
 */
export function useCurrentUser() {
	return useAuthStore((state) => state.user);
}

/**
 * Get auth loading state
 */
export function useAuthLoading() {
	return useAuthStore((state) => state.isLoading);
}

/**
 * Get auth error
 */
export function useAuthError() {
	return useAuthStore((state) => state.error);
}
