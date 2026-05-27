/**
 * Auth Utilities
 * Helper functions for authentication
 * 
 * Note: This module provides both client-side and server-side utilities.
 * For server-side API routes, getAuthToken accepts the NextRequest object.
 */

import { useAuthStore } from "@/hooks/use-auth-store";
import type { NextRequest } from "next/server";

/**
 * Get auth token from client-side store
 * Only use in client components/hooks
 */
export function getAuthTokenFromStore(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const user = useAuthStore.getState().user;
  return user?.token || null;
}

/**
 * Get auth token from Next.js request (for API routes)
 * Extracts token from Authorization header or access_token cookie
 */
export function getAuthTokenFromRequest(request: NextRequest): string | null {
  // First try Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Fallback to cookie
  const cookieToken = request.cookies.get("access_token");
  if (cookieToken?.value) {
    // Cookie value is "Bearer {token}"
    return cookieToken.value.replace("Bearer ", "");
  }

  return null;
}

/**
 * Get auth token (legacy - for backward compatibility)
 * For API routes, prefer using getAuthTokenFromRequest with the request object
 */
export function getAuthToken(): string | null {
  // Client-side: get from Zustand store
  if (typeof window !== "undefined") {
    const user = useAuthStore.getState().user;
    return user?.token || null;
  }
  return null;
}

/**
 * Get current user ID from store
 */
export function getCurrentUserId(): number | null {
  if (typeof window !== "undefined") {
    const user = useAuthStore.getState().user;
    return user?.user_id || null;
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return useAuthStore.getState().isAuthenticated;
  }
  return false;
}

/**
 * Get auth header for API requests (client-side)
 */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().user?.token;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}