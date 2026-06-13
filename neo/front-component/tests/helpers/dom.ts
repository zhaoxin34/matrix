/**
 * DOM 测试辅助函数
 *
 * 用 Range.createContextualFragment 解析 HTML 字符串,
 * 它是 W3C 标准 API,不会执行 <script> 内联脚本。
 *
 * `el()` 会把返回的元素自动挂到 document.body,
 * 避免 happy-dom 在跨文档 adoption 上的 quirk。
 */

export function el<T extends Element = Element>(html: string): T {
  const range = document.createRange();
  const frag = range.createContextualFragment(html.trim());
  if (!frag.firstElementChild) {
    throw new Error(`el() 解析失败(没有 firstElementChild): ${html}`);
  }
  const element = frag.firstElementChild as T;
  document.body.appendChild(element);
  return element;
}

export function fragment(html: string): DocumentFragment {
  const range = document.createRange();
  return range.createContextualFragment(html.trim());
}

export function clearBody(): void {
  document.body.textContent = '';
}
