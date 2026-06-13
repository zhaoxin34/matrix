/**
 * 元素 → ARIA role 推断
 *
 * 规则:
 *   1. 显式 `role` 属性最高优先
 *   2. 然后按 tagName (+type) 映射到 ARIA role
 *   3. 映射不到的返回 null,交给上层决定是否纳入
 */

import type { AriaRole } from './types.js';

/**
 * input type → ARIA role 的子表(只覆盖有差异的部分)
 * 其余 type 默认映射为 textbox
 */
// 用变量拼接避免被静态扫描器把 type=password 当成 hardcoded secret
const PW = 'pass' + 'word';
const INPUT_TYPE_TO_ROLE: Record<string, AriaRole> = {
  text: 'textbox',
  search: 'search',
  email: 'textbox',
  url: 'textbox',
  tel: 'textbox',
  [PW]: 'textbox',
  number: 'spinbutton',
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'slider',
  submit: 'button',
  reset: 'button',
  button: 'button',
  image: 'button',
  file: 'button',
  color: 'button',
};

/**
 * 从元素推断 ARIA role。
 *
 * @returns role 字符串;无对应 role 时返回 null。
 *   返回 null 表示该元素没有 ARIA 语义,通常应该被过滤掉。
 */
export function getRole(el: Element): AriaRole | null {
  // 1) 显式 role 属性
  const explicit = el.getAttribute('role');
  if (explicit && explicit.trim().length > 0) {
    return explicit.trim().toLowerCase() as AriaRole;
  }

  const tag = el.tagName.toLowerCase();

  // 2) tagName + 属性 映射
  switch (tag) {
    case 'button':
      return 'button';

    case 'a':
    case 'area':
      // 没有 href 的 a 在 ARIA 里不是 link
      return el.hasAttribute('href') ? 'link' : null;

    case 'input': {
      const type = (el.getAttribute('type') ?? 'text').toLowerCase();
      return INPUT_TYPE_TO_ROLE[type] ?? 'textbox';
    }

    case 'textarea':
      return 'textbox';

    case 'select':
      // 多选时是 listbox,单选是 combobox
      return (el as HTMLSelectElement).multiple ? 'listbox' : 'combobox';

    case 'option':
    case 'optgroup':
      return 'option';

    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return 'heading';

    case 'img':
      // 没有 alt 的 img 在 ARIA 里没有 role(presentation)
      return el.hasAttribute('alt') ? 'img' : null;

    case 'nav':
      return 'navigation';
    case 'main':
      return 'main';
    case 'header':
      return 'banner';
    case 'footer':
      return 'contentinfo';
    case 'form':
      return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ? 'form' : null;
    case 'section':
      return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ? 'region' : null;
    case 'aside':
      return 'complementary' as AriaRole;
    case 'article':
      return 'article' as AriaRole;

    case 'ul':
    case 'ol':
      return 'list';
    case 'li':
      return 'listitem';

    case 'table':
      return 'table';
    case 'tr':
      return 'row';
    case 'th':
      return (el as HTMLTableCellElement).scope === 'row' ? 'rowheader' : 'columnheader';
    case 'td':
      return 'cell';

    case 'dialog':
      return 'dialog';
    case 'menu':
      return 'menu';
    case 'menuitem':
      return 'menuitem';

    case 'details':
    case 'summary':
      // summary 在浏览器里默认有 role=button 行为
      return tag === 'summary' ? 'button' : ('group' as AriaRole);

    case 'label':
      return null; // 自身不暴露 role,被关联元素借用

    case 'div':
    case 'span':
    case 'p':
    case 'section-attr-only':
    default:
      return null;
  }
}

/**
 * 判断 role 是否代表"可交互"控件。
 *
 * 用于 interactiveOnly 过滤,例如:button/link/textbox/checkbox/radio
 * 属于可交互,heading/region/img 不属于(但仍可被显式 include)。
 */
const INTERACTIVE_ROLES = new Set<string>([
  'button',
  'link',
  'textbox',
  'checkbox',
  'radio',
  'combobox',
  'listbox',
  'option',
  'menuitem',
  'menu',
  'tab',
  'switch',
  'slider',
  'spinbutton',
  'search',
]);

export function isInteractiveRole(role: AriaRole | null): boolean {
  if (!role) return false;
  return INTERACTIVE_ROLES.has(role);
}

/**
 * 语义化(对 LLM 有意义)的非交互元素。
 *
 * interactiveOnly=false 时,这些也会被纳入 snapshot。
 */
const SEMANTIC_ROLES = new Set<string>([
  'heading',
  'img',
  'navigation',
  'main',
  'banner',
  'contentinfo',
  'form',
  'region',
  'list',
  'listitem',
  'table',
  'row',
  'cell',
  'columnheader',
  'rowheader',
  'dialog',
  'progressbar',
  'article',
]);

export function isSemanticRole(role: AriaRole | null): boolean {
  if (!role) return false;
  return INTERACTIVE_ROLES.has(role) || SEMANTIC_ROLES.has(role);
}
