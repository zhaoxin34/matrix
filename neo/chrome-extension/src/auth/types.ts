/**
 * Auth types — UserInfo and AuthStatus.
 *
 * UserInfo is the payload delivered from the frontend iframe via postMessage
 * (see design.md §7.5). AuthStatus is the popup's view of the auth state.
 */

export interface UserInfo {
  /** JWT, used as `Authorization: Bearer ${token}` */
  token: string
  /** Backend user id (the `sub` claim of the JWT) */
  userId: number
  /** Current workspace code, included in all upload API paths */
  workspaceCode: string
  /** Numeric workspace id (kept for client-side logging / future use) */
  workspaceId: number
  /** Username (frontend `useAuthStore.user.username`) */
  username: string | null
  /** ms timestamp when the userInfo was acquired */
  acquiredAt: number
}

export type AuthStatus = 'ok' | 'not_authenticated' | 'no_workspace' | 'timeout'
