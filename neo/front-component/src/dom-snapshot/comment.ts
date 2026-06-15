/**
 * 动态悬浮注释功能
 *
 * 提供运行时标注 DOM 元素的能力，在元素边上显示悬浮标签。
 * 与 data-ai-* 静态标注互补：
 * - data-ai-*：HTML 里写好，snapshot 时收集
 * - comment()：运行时调用，即时显示
 *
 * 使用示例：
 * ```ts
 * import { comment, removeComment, getAllComments } from '@neo/front-component/dom-snapshot';
 *
 * comment('e1', '这是一个危险操作');
 * comment('e2', '需要填写的内容');
 *
 * // 获取所有注释
 * const all = getAllComments();
 *
 * // 移除某个注释
 * removeComment('e1');
 * ```
 */

import { getElementById } from './snapshot.js';

// ── 类型定义 ──

/** 单条注释记录 */
export interface CommentRecord {
  /** 元素 id（e1, e2...），与 snapshot 输出的 id 一致 */
  id: string;
  /** 注释文本内容 */
  text: string;
  /** 原始 DOM 元素 */
  element: Element;
}

/** 注释配置项 */
export interface CommentOptions {
  /** 背景颜色，默认 '#fef08a'（黄色） */
  bgColor?: string;
  /** 文字颜色，默认 '#713f12' */
  textColor?: string;
  /** 边框颜色，默认 '#eab308' */
  borderColor?: string;
  /** 最大宽度，默认 200px */
  maxWidth?: string;
  /** Z-index，默认 999999 */
  zIndex?: number;
  /** 显示多久后自动消失（毫秒），默认 0 表示不自动消失 */
  autoHideMs?: number;
}

// ── 内部状态 ──

/** id → 注释信息的映射 */
const commentMap = new Map<string, CommentRecord>();

/** 注释 DOM 元素的 WeakMap（用于清理） */
const elementToMarker = new WeakMap<Element, HTMLElement>();

// ── 样式 ──

const DEFAULT_OPTIONS: Required<Omit<CommentOptions, 'autoHideMs'>> & { autoHideMs: number } = {
  bgColor: '#fef08a',
  textColor: '#713f12',
  borderColor: '#eab308',
  maxWidth: '200px',
  zIndex: 999999,
  autoHideMs: 0,
};

/** 注入全局样式（仅首次调用时） */
function injectStyles(): void {
  if (document.getElementById('neo-comment-styles')) return;

  const style = document.createElement('style');
  style.id = 'neo-comment-styles';
  style.textContent = `
    .neo-comment-marker {
      position: absolute;
      z-index: 999999;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1.5px solid;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      max-width: 200px;
      word-wrap: break-word;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: neo-comment-appear 0.15s ease-out;
    }

    @keyframes neo-comment-appear {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .neo-comment-marker::before {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 12px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid;
      border-top-color: inherit;
    }

    .neo-comment-marker::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 12px;
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid;
      border-top-color: inherit;
      filter: brightness(1.1);
    }
  `;
  document.head.appendChild(style);
}

// ── 核心函数 ──

/**
 * 给指定元素添加悬浮注释
 *
 * @param id       snapshot 输出的元素 id（如 'e1', 'e2'）
 * @param text     注释文本
 * @param options  可选配置
 * @returns 是否成功添加
 */
export function comment(id: string, text: string, options?: CommentOptions): boolean {
  const el = getElementById(id);
  if (!el) {
    console.warn(`[comment] 找不到 id=${id} 对应的元素`);
    return false;
  }

  // 合并配置
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 移除已有的注释（如果存在）
  removeComment(id);

  // 获取元素位置
  const rect = el.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // 创建注释标记
  const marker = document.createElement('div');
  marker.className = 'neo-comment-marker';
  marker.textContent = text;

  // 设置样式
  marker.style.cssText = `
    position: absolute;
    z-index: ${opts.zIndex};
    background-color: ${opts.bgColor};
    color: ${opts.textColor};
    border-color: ${opts.borderColor};
    max-width: ${opts.maxWidth};
  `;

  // 计算位置（元素右下角）
  const markerRect = {
    left: rect.right + scrollX + 8,
    top: rect.top + scrollY,
  };

  // 确保不超出视口
  const viewportWidth = window.innerWidth + scrollX;

  if (markerRect.left + 200 > viewportWidth) {
    // 超出右边界，改为左上角
    marker.style.cssText += `
      left: ${rect.left + scrollX - 8}px;
      top: ${rect.bottom + scrollY + 8}px;
    `;
    // 改为向上的三角
    marker.style.setProperty('--arrow-direction', 'up');
  } else {
    marker.style.left = `${markerRect.left}px`;
    marker.style.top = `${markerRect.top}px`;
  }

  // 确保在视口内
  document.body.appendChild(marker);
  const actualRect = marker.getBoundingClientRect();

  if (actualRect.bottom > window.innerHeight + scrollY) {
    // 超出底部，向上偏移
    const diff = actualRect.bottom - (window.innerHeight + scrollY);
    marker.style.top = `${parseInt(marker.style.top) - diff - 10}px`;
  }

  if (parseInt(marker.style.left) < scrollX) {
    marker.style.left = `${rect.left + scrollX}px`;
  }

  // 保存记录
  const record: CommentRecord = { id, text, element: el };
  commentMap.set(id, record);
  elementToMarker.set(el, marker);

  // 自动隐藏
  if (opts.autoHideMs > 0) {
    setTimeout(() => {
      if (commentMap.has(id)) {
        removeComment(id);
      }
    }, opts.autoHideMs);
  }

  return true;
}

/**
 * 移除指定元素的注释
 *
 * @param id snapshot 输出的元素 id
 * @returns 是否成功移除
 */
export function removeComment(id: string): boolean {
  const record = commentMap.get(id);
  if (!record) {
    return false;
  }

  const marker = elementToMarker.get(record.element);
  if (marker && marker.parentNode) {
    marker.parentNode.removeChild(marker);
  }

  elementToMarker.delete(record.element);
  commentMap.delete(id);

  return true;
}

/**
 * 获取所有注释
 *
 * @returns 注释列表
 */
export function getAllComments(): CommentRecord[] {
  return Array.from(commentMap.values());
}

/**
 * 清除所有注释
 */
export function clearAllComments(): void {
  for (const id of commentMap.keys()) {
    removeComment(id);
  }
}

/**
 * 更新指定元素的注释文本
 *
 * @param id   元素 id
 * @param text 新的注释文本
 * @returns 是否成功更新
 */
export function updateComment(id: string, text: string): boolean {
  const record = commentMap.get(id);
  if (!record) {
    // 不存在则添加
    return comment(id, text);
  }

  const marker = elementToMarker.get(record.element);
  if (marker) {
    marker.textContent = text;
  }

  record.text = text;
  return true;
}

// ── 初始化 ──

// 页面加载时注入样式
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
}
