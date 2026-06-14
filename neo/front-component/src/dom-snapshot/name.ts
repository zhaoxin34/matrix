/**
 * accessible name 计算
 *
 * 严格按 W3C ARIA 1.2 accessible name 计算规则,
 * 但做了"对 LLM 友好"的扩展:
 *   - data-testid 作为最强 hint 优先于 aria-label
 *     (因为它已经是工程内"机器可读"的命名约定)
 *
 * 计算顺序(命中即返回):
 *   1. data-testid
 *   2. aria-labelledby
 *   3. aria-label
 *   4. <label for="id"> 关联的 label 文本
 *   5. 元素自身 textContent (折叠空白、trim)
 *   6. title
 *   7. placeholder (仅 input/textarea)
 *   8. value (仅 input[type=submit|reset|button])
 *   9. alt (仅 img/area)
 */

import type { AriaRole } from './types.js';

/**
 * 把字符串折叠成"对 LLM 友好的单行"。
 * 多空白 → 单空格,首尾 trim。
 */
export function normalizeName(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * 取元素自身或后代中"可被看到"的文字内容。
 *
 * 排除:
 *   - display:none 的子树
 *   - 自身有 role 但被 aria-hidden 的子树
 *   - 纯控制字符
 */
function getTextContent(el: Element): string {
  // happy-dom 在某些情况下 textContent 会是 undefined,兜一下
  const raw = (el.textContent ?? '').toString();
  return normalizeName(raw);
}

/**
 * 解析 aria-labelledby 指向的元素集合,合并它们的 textContent。
 * 多个 id 用空格分隔。
 */
function resolveLabelledBy(el: Element, root: Element | Document): string {
  const ids = (el.getAttribute('aria-labelledby') ?? '').trim();
  if (!ids) return '';
  const parts: string[] = [];
  for (const id of ids.split(/\s+/)) {
    const ref = (root as Document | Element).querySelector
      ? (root as Document).getElementById
        ? (root as Document).getElementById(id)
        : null
      : null;
    // 兼容 root 不是 Document 的情况
    const target =
      ref ?? (root as Element).querySelector?.(`#${CSS.escape(id)}`) ?? document.getElementById(id);
    if (target) parts.push(getTextContent(target));
  }
  return parts.join(' ');
}

/**
 * 解析 input/textarea 通过 id 关联的 <label for="id"> 文本。
 */
function resolveLabelFor(el: Element): string {
  if (!el.id) return '';
  const label = (el.ownerDocument ?? document).querySelector(`label[for="${CSS.escape(el.id)}"]`);
  if (!label) return '';
  return getTextContent(label);
}

/**
 * 计算元素的 accessible name。
 *
 * @param el  目标元素
 * @param role 元素已经推断出的 ARIA role(部分规则依赖 role)
 * @param root 扫描根,用于解析 labelledby 引用
 */
export function getAccessibleName(
  el: Element,
  role: AriaRole | null,
  root: Element | Document,
): string {
  // 1) data-testid —— 工程的"机器可读约定",对 LLM 最稳定
  const testid = el.getAttribute('data-testid');
  if (testid && testid.trim().length > 0) {
    return normalizeName(testid);
  }

  // 2) aria-labelledby
  const labelledBy = resolveLabelledBy(el, root);
  if (labelledBy) return labelledBy;

  // 3) aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim().length > 0) {
    return normalizeName(ariaLabel);
  }

  // 4) <label for="..."> 关联
  const labelFor = resolveLabelFor(el);
  if (labelFor) return labelFor;

  // 5) 元素自身 textContent
  //    - button/link/menuitem/tab/option/heading 等天然是容器,直接用 textContent
  //    - input/textarea/img 等不应该用 textContent(它们没有显示文字)
  if (
    role &&
    [
      'button',
      'link',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'tab',
      'option',
      'heading',
      'listitem',
      'cell',
      'columnheader',
      'rowheader',
    ].includes(role)
  ) {
    const txt = getTextContent(el);
    if (txt) return txt;
  } else if (role === 'img') {
    // img 走 alt 分支(第 9 步)
  } else if (
    role === 'textbox' ||
    role === 'combobox' ||
    role === 'listbox' ||
    role === 'spinbutton' ||
    role === 'searchbox'
  ) {
    // form 控件走 placeholder/value 分支
  } else if (!role) {
    // 无 role 的元素,如果有意义文字也保留(配合 include 模式)
    const txt = getTextContent(el);
    if (txt) return txt;
  }

  // 6) title 属性
  const title = el.getAttribute('title');
  if (title && title.trim().length > 0) {
    return normalizeName(title);
  }

  // 7) placeholder —— 仅 input/textarea
  if (
    role === 'textbox' ||
    role === 'combobox' ||
    role === 'listbox' ||
    role === 'spinbutton' ||
    role === 'searchbox'
  ) {
    const placeholder = el.getAttribute('placeholder');
    if (placeholder && placeholder.trim().length > 0) {
      return normalizeName(placeholder);
    }
  }

  // 8) value —— 仅 input[type=submit|reset|button]
  if (role === 'button') {
    const tag = el.tagName.toLowerCase();
    if (tag === 'input') {
      const value = (el as HTMLInputElement).value;
      if (value && value.trim().length > 0) return normalizeName(value);
    }
  }

  // 9) alt —— 仅 img
  if (role === 'img') {
    const alt = el.getAttribute('alt');
    if (alt && alt.trim().length > 0) return normalizeName(alt);
  }

  return '';
}
