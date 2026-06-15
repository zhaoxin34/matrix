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
 * // 默认位置（元素右侧顶部）
 * comment('e1', '这是一个危险操作');
 *
 * // 自定义位置和样式
 * comment('e2', '提示信息', {
 *   position: 'right_middle',
 *   x: 10,
 *   y: -20,
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
 *
 * 以元素为原点，标注出现在配置的方位：
 *
 *        top_left ─── top_center ─── top_right
 *           │                         │
 *           │                         │
 *  left_top │  [element]              │ right_top
 *           │                         │
 *           │                         │
 *      left_middle ── center ── right_middle
 *           │                         │
 *           │                         │
 *  left_bottom │  [element]          │ right_bottom
 *           │                         │
 *           │                         │
 *  bottom_left ── bottom_center ── bottom_right
 */
export type CommentPosition =
  | 'top_left'
  | 'top_center'
  | 'top_right'
  | 'right_top'
  | 'right_middle'
  | 'right_bottom'
  | 'bottom_left'
  | 'bottom_center'
  | 'bottom_right'
  | 'left_top'
  | 'left_middle'
  | 'left_bottom';

/** 注释配置项 */
export interface CommentOptions {
  // ── 位置配置 ──

  /** 显示位置，默认 'right_top' */
  position?: CommentPosition;

  /** 水平偏移量（px），默认 8，正值向右/下 */
  x?: number;

  /** 垂直偏移量（px），默认 0，正值向下 */
  y?: number;

  // ── 样式配置 ──

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

  // ── 行为配置 ──

  /** 显示多久后自动消失（毫秒），默认 0 表示不自动消失 */
  autoHideMs?: number;

  /** 是否显示箭头，默认 true */
  showArrow?: boolean;
}

// ── 内部状态 ──

/** id → 注释信息的映射 */
const commentMap = new Map<string, CommentRecord>();

/** 注释 DOM 元素的 WeakMap（用于清理） */
const elementToMarker = new WeakMap<Element, HTMLElement>();

// ── 样式 ──

const DEFAULT_OPTIONS: Required<Omit<CommentOptions, 'position' | 'x' | 'y' | 'showArrow'>> & {
  position: CommentPosition;
  x: number;
  y: number;
  showArrow: boolean;
} = {
  position: 'right_top',
  x: 8,
  y: 0,
  bgColor: '#fef08a',
  textColor: '#713f12',
  borderColor: '#eab308',
  borderRadius: '6px',
  padding: '6px 10px',
  fontSize: '12px',
  maxWidth: '200px',
  zIndex: 999999,
  autoHideMs: 0,
  showArrow: true,
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
      border-radius: 6px;
      border: 1.5px solid;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.4;
      word-wrap: break-word;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: neo-comment-appear 0.15s ease-out;
    }

    @keyframes neo-comment-appear {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .neo-comment-marker .neo-comment-arrow {
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
    }

    /* 箭头朝左（在右侧显示） */
    .neo-comment-marker.arrow-left::before,
    .neo-comment-marker.arrow-left::after {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      border-style: solid;
    }
    .neo-comment-marker.arrow-left::before {
      left: -7px;
      border-width: 6px 6px 6px 0;
      border-color: transparent var(--arrow-color) transparent transparent;
    }
    .neo-comment-marker.arrow-left::after {
      left: -4px;
      border-width: 5px 5px 5px 0;
      border-color: transparent var(--bg-color) transparent transparent;
    }

    /* 箭头朝右（在左侧显示） */
    .neo-comment-marker.arrow-right::before,
    .neo-comment-marker.arrow-right::after {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      border-style: solid;
    }
    .neo-comment-marker.arrow-right::before {
      right: -7px;
      border-width: 6px 0 6px 6px;
      border-color: transparent transparent transparent var(--arrow-color);
    }
    .neo-comment-marker.arrow-right::after {
      right: -4px;
      border-width: 5px 0 5px 5px;
      border-color: transparent transparent transparent var(--bg-color);
    }

    /* 箭头朝上（在下方显示） */
    .neo-comment-marker.arrow-top::before,
    .neo-comment-marker.arrow-top::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      border-style: solid;
    }
    .neo-comment-marker.arrow-top::before {
      top: -7px;
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--arrow-color) transparent;
    }
    .neo-comment-marker.arrow-top::after {
      top: -4px;
      border-width: 0 5px 5px 5px;
      border-color: transparent transparent var(--bg-color) transparent;
    }

    /* 箭头朝下（在上方显示） */
    .neo-comment-marker.arrow-bottom::before,
    .neo-comment-marker.arrow-bottom::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      border-style: solid;
    }
    .neo-comment-marker.arrow-bottom::before {
      bottom: -7px;
      border-width: 6px 6px 0 6px;
      border-color: var(--arrow-color) transparent transparent transparent;
    }
    .neo-comment-marker.arrow-bottom::after {
      bottom: -4px;
      border-width: 5px 5px 0 5px;
      border-color: var(--bg-color) transparent transparent transparent;
    }
  `;
  document.head.appendChild(style);
}

// ── 位置计算 ──

interface PositionResult {
  left: number;
  top: number;
  arrowClass: string;
}

/**
 * 根据位置配置计算注释的坐标和箭头方向
 * elRect 是 getBoundingClientRect() 返回的视口坐标
 * position: fixed 也是相对于视口，所以直接用视口坐标即可
 */
function calculatePosition(
  elRect: DOMRect,
  position: CommentPosition,
  x: number,
  y: number,
  markerWidth: number,
  markerHeight: number,
): PositionResult {
  const GAP = 4; // 与元素的间距

  // 锚点位置（元素的边缘点）- 这些都是视口坐标
  let anchorX = 0;
  let anchorY = 0;
  let arrowClass: 'arrow-left' | 'arrow-right' | 'arrow-top' | 'arrow-bottom' = 'arrow-left';

  switch (position) {
    // ── 顶部 ──
    case 'top_left':
      anchorX = elRect.left;
      anchorY = elRect.top;
      arrowClass = 'arrow-bottom';
      break;
    case 'top_center':
      anchorX = elRect.left + elRect.width / 2;
      anchorY = elRect.top;
      arrowClass = 'arrow-bottom';
      break;
    case 'top_right':
      anchorX = elRect.right;
      anchorY = elRect.top;
      arrowClass = 'arrow-bottom';
      break;

    // ── 右侧 ──
    case 'right_top':
      anchorX = elRect.right;
      anchorY = elRect.top;
      arrowClass = 'arrow-left';
      break;
    case 'right_middle':
      anchorX = elRect.right;
      anchorY = elRect.top + elRect.height / 2;
      arrowClass = 'arrow-left';
      break;
    case 'right_bottom':
      anchorX = elRect.right;
      anchorY = elRect.bottom;
      arrowClass = 'arrow-left';
      break;

    // ── 底部 ──
    case 'bottom_left':
      anchorX = elRect.left;
      anchorY = elRect.bottom;
      arrowClass = 'arrow-top';
      break;
    case 'bottom_center':
      anchorX = elRect.left + elRect.width / 2;
      anchorY = elRect.bottom;
      arrowClass = 'arrow-top';
      break;
    case 'bottom_right':
      anchorX = elRect.right;
      anchorY = elRect.bottom;
      arrowClass = 'arrow-top';
      break;

    // ── 左侧 ──
    case 'left_top':
      anchorX = elRect.left;
      anchorY = elRect.top;
      arrowClass = 'arrow-right';
      break;
    case 'left_middle':
      anchorX = elRect.left;
      anchorY = elRect.top + elRect.height / 2;
      arrowClass = 'arrow-right';
      break;
    case 'left_bottom':
      anchorX = elRect.left;
      anchorY = elRect.bottom;
      arrowClass = 'arrow-right';
      break;
  }

  // 根据箭头方向计算标注位置
  let markerLeft: number;
  let markerTop: number;

  switch (arrowClass) {
    case 'arrow-left': // 标注在右侧，箭头朝左
      markerLeft = anchorX + GAP + x;
      markerTop = anchorY + y - markerHeight / 2;
      break;
    case 'arrow-right': // 标注在左侧，箭头朝右
      markerLeft = anchorX - markerWidth - GAP - x;
      markerTop = anchorY + y - markerHeight / 2;
      break;
    case 'arrow-top': // 标注在下方，箭头朝上
      markerLeft = anchorX + x - markerWidth / 2;
      markerTop = anchorY + GAP + y;
      break;
    case 'arrow-bottom': // 标注在上方，箭头朝下
      markerLeft = anchorX + x - markerWidth / 2;
      markerTop = anchorY - markerHeight - GAP - y;
      break;
    default:
      markerLeft = anchorX + GAP;
      markerTop = anchorY;
  }

  return {
    left: markerLeft,
    top: markerTop,
    arrowClass,
  };
}

/**
 * 调整位置确保在视口内
 */
function clampToViewport(
  left: number,
  top: number,
  markerWidth: number,
  markerHeight: number,
  arrowClass: string,
): { left: number; top: number; arrowClass: string } {
  let resultLeft = left;
  let resultTop = top;

  // 视口边界
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxLeft = viewportWidth - markerWidth;
  const maxTop = viewportHeight - markerHeight;

  // 左右边界
  if (resultLeft < 0) {
    resultLeft = 0;
  }
  if (resultLeft > maxLeft) {
    resultLeft = maxLeft;
  }

  // 上下边界
  if (resultTop < 0) {
    resultTop = 0;
  }
  if (resultTop > maxTop) {
    resultTop = maxTop;
  }

  return {
    left: resultLeft,
    top: resultTop,
    arrowClass,
  };
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

  // 获取元素位置（相对于视口）
  const elRect = el.getBoundingClientRect();

  // 创建注释标记
  const marker = document.createElement('div');
  marker.className = 'neo-comment-marker';
  marker.textContent = text;

  // 设置基础样式 - 使用 position: fixed 相对于视口定位
  marker.style.cssText = `
    position: fixed;
    z-index: ${opts.zIndex};
    background-color: ${opts.bgColor};
    color: ${opts.textColor};
    border-color: ${opts.borderColor};
    border-radius: ${opts.borderRadius};
    padding: ${opts.padding};
    font-size: ${opts.fontSize};
    max-width: ${opts.maxWidth};
    --bg-color: ${opts.bgColor};
    --arrow-color: ${opts.borderColor};
  `;

  // 临时添加到 body 以获取尺寸
  marker.style.visibility = 'hidden';
  document.body.appendChild(marker);
  const markerRect = marker.getBoundingClientRect();
  const markerWidth = markerRect.width;
  const markerHeight = markerRect.height;

  // 计算位置（使用视口坐标）
  const rawPos = calculatePosition(
    elRect,
    opts.position,
    opts.x,
    opts.y,
    markerWidth,
    markerHeight,
  );

  // 调整到视口内
  const clampedPos = clampToViewport(
    rawPos.left,
    rawPos.top,
    markerWidth,
    markerHeight,
    rawPos.arrowClass,
  );

  // 应用最终位置
  marker.style.left = `${clampedPos.left}px`;
  marker.style.top = `${clampedPos.top}px`;
  marker.style.visibility = 'visible';

  // 添加箭头
  if (opts.showArrow) {
    marker.classList.add(clampedPos.arrowClass);
  }

  // 存储配置到 dataset，供滚动/resize 时重新计算
  marker.dataset.position = opts.position;
  marker.dataset.offsetX = String(opts.x);
  marker.dataset.offsetY = String(opts.y);

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
 * 更新指定元素的注释
 *
 * @param id      元素 id
 * @param text   新的注释文本
 * @param options 可选的更新配置
 * @returns 是否成功更新
 */
export function updateComment(id: string, text: string, options?: CommentOptions): boolean {
  const record = commentMap.get(id);
  if (!record) {
    // 不存在则添加
    return comment(id, text, options);
  }

  const marker = elementToMarker.get(record.element);
  if (marker) {
    marker.textContent = text;
  }

  record.text = text;

  // 如果有新的配置项，更新样式和位置
  if (options) {
    removeComment(id);
    return comment(id, text, options);
  }

  return true;
}

// ── 导出所有位置常量 ──

/** 位置常量，便于使用 */
export const CommentPositions = {
  TOP_LEFT: 'top_left' as CommentPosition,
  TOP_CENTER: 'top_center' as CommentPosition,
  TOP_RIGHT: 'top_right' as CommentPosition,
  RIGHT_TOP: 'right_top' as CommentPosition,
  RIGHT_MIDDLE: 'right_middle' as CommentPosition,
  RIGHT_BOTTOM: 'right_bottom' as CommentPosition,
  BOTTOM_LEFT: 'bottom_left' as CommentPosition,
  BOTTOM_CENTER: 'bottom_center' as CommentPosition,
  BOTTOM_RIGHT: 'bottom_right' as CommentPosition,
  LEFT_TOP: 'left_top' as CommentPosition,
  LEFT_MIDDLE: 'left_middle' as CommentPosition,
  LEFT_BOTTOM: 'left_bottom' as CommentPosition,
} as const;

// ── 初始化 ──

// 页面加载时注入样式
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
}

// ── 滚动/窗口大小监听器 ──

let updateScheduled = false;

/** 节流更新所有 marker 位置 */
function scheduleUpdate() {
  if (updateScheduled) return;
  updateScheduled = true;
  requestAnimationFrame(() => {
    updateScheduled = false;
    updateAllMarkers();
  });
}

/** 重新计算所有 marker 的位置 */
function updateAllMarkers() {
  for (const [, record] of commentMap) {
    const rect = record.element.getBoundingClientRect();
    const marker = elementToMarker.get(record.element);
    if (!marker) continue;

    // 从 dataset 读取用户传入的位置配置
    const opts: CommentOptions = {};
    if (marker.dataset.position) opts.position = marker.dataset.position as CommentPosition;
    if (marker.dataset.offsetX) opts.x = Number(marker.dataset.offsetX);
    if (marker.dataset.offsetY) opts.y = Number(marker.dataset.offsetY);
    const finalOpts = { ...DEFAULT_OPTIONS, ...opts };

    const markerRect = marker.getBoundingClientRect();
    const rawPos = calculatePosition(
      rect,
      finalOpts.position,
      finalOpts.x,
      finalOpts.y,
      markerRect.width,
      markerRect.height,
    );
    const clampedPos = clampToViewport(
      rawPos.left,
      rawPos.top,
      markerRect.width,
      markerRect.height,
      rawPos.arrowClass,
    );
    marker.style.left = `${clampedPos.left}px`;
    marker.style.top = `${clampedPos.top}px`;
  }
}

// 页面滚动/resize 时更新 marker
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  // 捕获阶段监听可能滚动的容器
  document.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
}
