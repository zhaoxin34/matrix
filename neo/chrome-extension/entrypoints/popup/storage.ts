/**
 * 配置存储模块
 * 使用 chrome.storage.local 存储 Extension 配置
 */
import type { ExtensionConfig } from './types';
import { DEFAULT_CONFIG, CONFIG_STORAGE_KEY } from './types';

/**
 * 读取配置
 */
export async function loadConfig(): Promise<ExtensionConfig> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(CONFIG_STORAGE_KEY, (result) => {
        const config = result[CONFIG_STORAGE_KEY];
        if (config) {
          // 合并默认配置，确保新字段有值
          resolve({ ...DEFAULT_CONFIG, ...config });
        } else {
          resolve(DEFAULT_CONFIG);
        }
      });
    } catch (error) {
      console.warn('chrome.storage not available, using defaults:', error);
      resolve(DEFAULT_CONFIG);
    }
  });
}

/**
 * 保存配置
 */
export async function saveConfig(config: Partial<ExtensionConfig>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(CONFIG_STORAGE_KEY, (result) => {
        const currentConfig = result[CONFIG_STORAGE_KEY] || DEFAULT_CONFIG;
        const newConfig = { ...currentConfig, ...config };
        
        chrome.storage.local.set(
          { [CONFIG_STORAGE_KEY]: newConfig },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      });
    } catch (error) {
      console.warn('chrome.storage not available:', error);
      resolve(); // 不阻塞 UI
    }
  });
}

/**
 * 通知 Content Script 配置已更新
 */
export async function notifyConfigUpdated(
  changes: Partial<ExtensionConfig>
): Promise<void> {
  try {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab?.id) {
      // 发送消息到 Content Script
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'CONFIG_UPDATED',
          payload: changes,
        });
      } catch (error) {
        // Content Script 可能未加载，忽略错误
        console.warn('Failed to notify Content Script:', error);
      }
    }
  } catch (error) {
    console.warn('Failed to query tabs:', error);
  }
}