/**
 * Agent Steer Configuration Types
 *
 * 持久化在 chrome.storage.local 中的配置项定义。
 * 注意：workspace_code 不在这里 —— 由 iframe bridge (§Auth) 动态拉取。
 */

export interface AgentSteerConfig {
  /** 后端 API 根 URL，例如 http://localhost:8000 */
  api_base_url: string
  /** frontend 根 URL，例如 http://localhost:3000 */
  frontend_base_url: string
  /** frontend 上的 user-info 页面路径，默认 /agent-steer/user-info */
  user_info_path: string
}

/** 读配置时的结果（带类型守卫） */
export type GetConfigResult =
  | { ok: true; config: AgentSteerConfig }
  | { ok: false; missing: Array<keyof AgentSteerConfig> }

/** 默认值 */
export const DEFAULT_USER_INFO_PATH = '/agent-steer/user-info'
