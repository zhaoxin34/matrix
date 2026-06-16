/**
 * System Configuration Module
 * 系统配置管理 - 从 storage.ts 分离出来
 */

import type { Config } from "../types";

// ==================== 常量 ====================

const CONFIG_KEY = "local:recording.config";

// 获取 storage API（兼容 browser 和 chrome）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _browser = typeof browser !== "undefined" ? browser : (chrome as any);
const storage = _browser?.storage;

// ==================== 配置模型 ====================

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: Config = {
  neoUrl: "http://localhost:3000",
  backendUrl: "http://localhost:8000",
  get testMode() {
    // 通过环境变量控制测试模式
    return import.meta.env.VITE_DEBUG === "TRUE";
  },
};

// ==================== 配置操作 ====================

/**
 * 获取配置
 */
export async function getConfig(): Promise<Config> {
  if (!storage?.local) {
    return DEFAULT_CONFIG;
  }

  return new Promise((resolve) => {
    storage.local.get([CONFIG_KEY], (result: Record<string, unknown>) => {
      const config = result[CONFIG_KEY] as Config | undefined;
      resolve(config ?? DEFAULT_CONFIG);
    });
  });
}

/**
 * 设置配置
 */
export async function setConfig(config: Partial<Config>): Promise<void> {
  if (!storage?.local) return;

  const current = await getConfig();
  return new Promise((resolve) => {
    storage.local.set(
      {
        [CONFIG_KEY]: { ...current, ...config },
      },
      () => {
        resolve();
      },
    );
  });
}

/**
 * 保存配置（setConfig 的别名）
 */
export const saveConfig = setConfig;
