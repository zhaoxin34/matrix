/**
 * 动态悬浮注释功能
 *
 * 提供运行时标注 DOM 元素的能力，在元素边上显示悬浮标签。
 * 与 data-ai-* 静态标注互补：
 * - data-ai-*：HTML 里写好，snapshot 时收集
 * - comment()：运行时调用，即时显示
 *
 * 简单实现：
 * - 注释框用 position: absolute 放在 body 下
 * - body 被自动设置为 position: relative（这样 absolute 相对 body/整页）
 * - 注释会跟着元素一起滚出屏幕
 *
 * 使用示例：
 * ```ts
 * import { comment, removeComment, getAllComments } from '@neo/front-component/dom-snapshot';
 *
 * // 默认位置（元素右侧）
 * comment('e1', '这是一个危险操作');
 *
 * // 自定义位置和样式
 * comment('e2', '提示信息', {
 *   position: 'top-end',
 *   bgColor: '#fef3c7',
 *   borderColor: '#f59e0b',
 * });
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

/**
 * 注释显示位置
 */
export type CommentPosition =
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'right'
  | 'right-end'
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'left-start'
  | 'left'
  | 'left-end';

/** 注释配置项 */
export interface CommentOptions {
  /** 显示位置，默认 'right' */
  position?: CommentPosition;

  /** 水平偏移量（px），默认 8 */
  offsetX?: number;

  /** 垂直偏移量（px），默认 0 */
  offsetY?: number;

  /** 背景颜色，默认 '#fef08a'（黄色） */
  bgColor?: string;

  /** 文字颜色，默认 '#713f12' */
  textColor?: string;

  /** 边框颜色，默认 '#eab308' */
  borderColor?: string;

  /** 圆角大小，默认 '6px' */
  borderRadius?: string;

  /** 内边距，默认 '6px 10px' */
  padding?: string;

  /** 字体大小，默认 '12px' */
  fontSize?: string;

  /** 最大宽度，默认 '200px' */
  maxWidth?: string;

  /** Z-index，默认 999999 */
  zIndex?: number;

  /** 显示多久后自动消失（毫秒），默认 0 表示不自动消失 */
  autoHideMs?: number;
}

// ── 内部状态 ──

/** id → 注释信息的映射 */
const commentMap = new Map<string, CommentRecord>();

/** marker DOM 节点 → 元素 + 配置 + 清理函数 */
const markerState = new WeakMap<
  HTMLElement,
  {
    element: Element;
    position: CommentPosition;
    offsetX: number;
    offsetY: number;
    autoHideTimer: ReturnType<typeof setTimeout> | null;
    updatePosition: () => void;
  }
>();

// ── 默认配置 ──

const DEFAULT_OPTIONS = {
  position: 'right' as CommentPosition,
  offsetX: 8,
  offsetY: 0,
  bgColor: '#fef08a',
  textColor: '#713f12',
  borderColor: '#eab308',
  borderRadius: '6px',
  padding: '6px 10px',
  fontSize: '12px',
  maxWidth: '200px',
  zIndex: 999999,
  autoHideMs: 0,
};

// ── 样式注入 ──

let stylesInjected = false;
function injectStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  // 让 body 变成 position: relative（如果还没有）
  // 这样 position: absolute 的注释会相对 body（整页）定位，跟随滚动
  if (document.body && getComputedStyle(document.body).position === 'static') {
    document.body.style.position = 'relative';
  }

  const style = document.createElement('style');
  style.id = 'neo-comment-styles';
  style.textContent = `
    .neo-comment-marker {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 999999;
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}

// ── 位置计算 ──

interface PosOffset {
  left: number;
  top: number;
}

/**
 * 计算注释相对元素的偏移（元素的视口坐标）
 * 元素位置变化时需要重新计算
 */
function computeMarkerOffset(
  elRect: DOMRect,
  position: CommentPosition,
  offsetX: number,
  offsetY: number,
  markerW: number,
  markerH: number,
): PosOffset {
  const GAP = 4;
  const [main, align] = position.split('-') as ['top' | 'right' | 'bottom' | 'left', string?];

  let left = 0;
  let top = 0;

  if (main === 'right') {
    left = elRect.right + GAP + offsetX;
    if (align === 'start') {
      top = elRect.top + offsetY;
    } else {
      // 'center' 或 'end'：右端对齐
      top = elRect.bottom - markerH + offsetY;
    }
  } else if (main === 'left') {
    left = elRect.left - markerW - GAP - offsetX;
    if (align === 'start') {
      top = elRect.top + offsetY;
    } else {
      top = elRect.bottom - markerH + offsetY;
    }
  } else if (main === 'top') {
    top = elRect.top - markerH - GAP - offsetY;
    if (align === 'start') {
      left = elRect.left + offsetX;
    } else {
      // 'center' 或 'end'：右端对齐
      left = elRect.right - markerW + offsetX;
    }
  } else if (main === 'bottom') {
    top = elRect.bottom + GAP + offsetY;
    if (align === 'start') {
      left = elRect.left + offsetX;
    } else {
      left = elRect.right - markerW + offsetX;
    }
  }

  return { left, top };
}

// ── 核心 API ──

/**
 * 给指定元素添加悬浮注释
 */
export function comment(id: string, text: string, options?: CommentOptions): boolean {
  const el = getElementById(id);
  if (!el) {
    console.warn(`[comment] 找不到 id=${id} 对应的元素`);
    return false;
  }

  injectStyles();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 移除已有
  removeComment(id);

  // 创建 marker
  const marker = document.createElement('div');
  marker.className = 'neo-comment-marker';
  marker.textContent = text;
  marker.style.cssText = `
    background-color: ${opts.bgColor};
    color: ${opts.textColor};
    border: 1.5px solid ${opts.borderColor};
    border-radius: ${opts.borderRadius};
    padding: ${opts.padding};
    font-size: ${opts.fontSize};
    max-width: ${opts.maxWidth};
    z-index: ${opts.zIndex};
  `;
  marker.dataset.commentId = id;

  document.body.appendChild(marker);

  // 位置更新函数
  const updatePosition = () => {
    const elRect = el.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const offset = computeMarkerOffset(
      elRect,
      opts.position,
      opts.offsetX,
      opts.offsetY,
      markerRect.width,
      markerRect.height,
    );
    // 直接用视口坐标（因为 marker 在 body 下，body 是 relative，所以等于整页坐标）
    // 实际上：marker position: absolute + body position: relative = 相对 body
    // marker 视口坐标 = 整页坐标 - scrollY
    // 我们要 marker 显示在元素视口坐标位置 → 需要 marker.style.left/top = 元素视口坐标
    // 等等不对：marker style.left 是相对 body（整页），所以应该 = 元素整页坐标
    // 元素整页坐标 = 元素视口坐标 + scrollY
    // 但 marker.style 改变时，浏览器自动加 scrollY？不，body relative 的话
    // marker.style.top = Y 表示 marker 在 body 内 y=Y
    // body 是整页高度，所以 marker 在整页 y=Y
    // 视口 y = body y - scrollY = Y - scrollY
    // 我们要 marker 视口 y = 元素视口 y → Y - scrollY = elRect.top → Y = elRect.top + scrollY
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    marker.style.left = `${offset.left + scrollX}px`;
    marker.style.top = `${offset.top + scrollY}px`;
  };

  updatePosition();

  // 监听滚动和 resize
  window.addEventListener('scroll', updatePosition, { passive: true });
  window.addEventListener('resize', updatePosition);

  // 自动隐藏
  let autoHideTimer: ReturnType<typeof setTimeout> | null = null;
  if (opts.autoHideMs > 0) {
    autoHideTimer = setTimeout(() => removeComment(id), opts.autoHideMs);
  }

  // 保存状态
  markerState.set(marker, {
    element: el,
    position: opts.position,
    offsetX: opts.offsetX,
    offsetY: opts.offsetY,
    autoHideTimer,
    updatePosition,
  });

  commentMap.set(id, { id, text, element: el });
  return true;
}

/**
 * 移除指定元素的注释
 */
export function removeComment(id: string): boolean {
  const record = commentMap.get(id);
  if (!record) return false;

  const marker = document.querySelector<HTMLElement>(
    `.neo-comment-marker[data-comment-id="${id}"]`,
  );
  if (marker) {
    const state = markerState.get(marker);
    if (state) {
      window.removeEventListener('scroll', state.updatePosition);
      window.removeEventListener('resize', state.updatePosition);
      if (state.autoHideTimer) clearTimeout(state.autoHideTimer);
    }
    marker.remove();
  }

  commentMap.delete(id);
  return true;
}

/**
 * 获取所有注释
 */
export function getAllComments(): CommentRecord[] {
  return Array.from(commentMap.values());
}

/**
 * 清除所有注释
 */
export function clearAllComments(): void {
  for (const id of Array.from(commentMap.keys())) {
    removeComment(id);
  }
}

/**
 * 更新指定元素的注释
 */
export function updateComment(id: string, text: string, options?: CommentOptions): boolean {
  const record = commentMap.get(id);
  if (!record) {
    return comment(id, text, options);
  }

  const marker = document.querySelector<HTMLElement>(
    `.neo-comment-marker[data-comment-id="${id}"]`,
  );
  if (marker) {
    marker.textContent = text;
  }
  record.text = text;

  if (options) {
    removeComment(id);
    return comment(id, text, options);
  }
  return true;
}

// ── 位置常量 ──

export const CommentPositions = {
  TOP_START: 'top-start' as CommentPosition,
  TOP: 'top' as CommentPosition,
  TOP_END: 'top-end' as CommentPosition,
  RIGHT_START: 'right-start' as CommentPosition,
  RIGHT: 'right' as CommentPosition,
  RIGHT_END: 'right-end' as CommentPosition,
  BOTTOM_START: 'bottom-start' as CommentPosition,
  BOTTOM: 'bottom' as CommentPosition,
  BOTTOM_END: 'bottom-end' as CommentPosition,
  LEFT_START: 'left-start' as CommentPosition,
  LEFT: 'left' as CommentPosition,
  LEFT_END: 'left-end' as CommentPosition,
} as const;
