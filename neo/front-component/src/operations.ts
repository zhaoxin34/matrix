/**
 * click / fill 操作
 *
 * 设计要点:
 *   - 默认通过 snapshot() 返回的 nodes 数组找 id,避免操作过时引用
 *   - 找不到时尝试 getElementById 兜底(支持外部持有 Element 的场景)
 *   - fill 会模拟用户输入,触发 input + change 事件,触发 React 等框架的 state 更新
 */

import type { NodeId, OperationResult, SnapshotNode } from './types.js';
import { getElementById } from './snapshot.js';

/**
 * 在 nodes 数组里按 id 找元素;找不到回退到全局 id 映射。
 */
function resolveElement(id: NodeId, nodes?: SnapshotNode[]): Element | null {
  if (nodes && nodes.length > 0) {
    const node = nodes.find((n) => n.id === id);
    if (!node) {
      return getElementById(id);
    }
  }
  return getElementById(id);
}

/**
 * 触发点击。
 *
 * @returns 成功返回 { ok: true },未找到 id 或元素不可点击返回 { ok: false, message }
 */
export function click(id: NodeId, nodes?: SnapshotNode[]): OperationResult {
  const el = resolveElement(id, nodes);
  if (!el) {
    return { ok: false, id, message: `找不到 id=${id} 对应的元素` };
  }
  if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') {
    return { ok: false, id, message: `id=${id} 元素被禁用` };
  }

  // 模拟真实用户点击序列:
  //   pointerdown → mousedown → pointerup → mouseup → click
  // happy-dom 对这些事件有部分支持,这里发最关键的 click
  // 真实浏览器中,el.click() 已经能触发 onclick 监听器和默认行为
  if (typeof (el as HTMLElement).click === 'function') {
    (el as HTMLElement).click();
  } else {
    // 兜底: 直接 dispatch MouseEvent
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  return { ok: true, id };
}

/**
 * 给文本输入框设值并触发 input + change 事件。
 *
 * 实现细节:
 *   - 用 native setter 写入 value,这样 React 的 onChange/onInput 能监听到
 *   - 兼容 input / textarea
 *   - 对 select 不做特殊处理(应该用选中 option 代替)
 */
export function fill(id: NodeId, value: string, nodes?: SnapshotNode[]): OperationResult {
  const el = resolveElement(id, nodes);
  if (!el) {
    return { ok: false, id, message: `找不到 id=${id} 对应的元素` };
  }

  const tag = el.tagName.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') {
    return { ok: false, id, message: `id=${id} 不是可填写的 input/textarea (tag=${tag})` };
  }

  if ((el as HTMLInputElement).disabled || el.getAttribute('aria-disabled') === 'true') {
    return { ok: false, id, message: `id=${id} 元素被禁用` };
  }

  // 关键: React/Vue 等框架通过 Object.defineProperty 在 input 上劫持了 value 的 setter。
  // 我们必须从元素原型上拿到原生 HTMLInputElement.prototype,再调用原生 setter,
  // 否则 React 不会触发 state 更新。
  const proto =
    tag === 'input'
      ? (el as HTMLInputElement).constructor.prototype
      : HTMLTextAreaElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    (el as HTMLInputElement).value = value;
  }

  // 触发 input + change 事件,让监听器感知到值变化
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  return { ok: true, id };
}
