/**
 * snapshot 核心: 遍历 DOM,生成 LLM 友好的扁平节点数组。
 *
 * 关键设计:
 *   - id 是按 DOM 树深度优先遍历顺序分配的 e1/e2/...
 *     (LLM 拿到 id 后,可以根据数组顺序反推 DOM 位置)
 *   - 过滤规则分两层:
 *     a) 永远跳过: aria-hidden、零尺寸且无内容
 *     b) 默认跳过: 无 role 的纯装饰元素(div/span)
 *     c) 选项: include / exclude / interactiveOnly / maxDepth
 *   - 行为变更: disabled 元素**不再过滤**,而是通过 `disabled: true` 字段标注
 *     (让 LLM 知道"有但不能用",而不是看不到)
 */

import type {
  AriaRole,
  NodeId,
  SnapshotMeta,
  SnapshotNode,
  SnapshotOptions,
  SnapshotRect,
  SnapshotResult,
  SnapshotStats,
} from './types.js';
import { getAccessibleName } from './name.js';
import { getRole, isInteractiveRole, isSemanticRole } from './role.js';

/** 库版本号,写入 SnapshotMeta */
export const LIB_VERSION = '0.2.0';

/**
 * 模块级 id → Element 映射,供 click/fill 使用。
 *
 * 用 Map 而非 WeakMap 是为了支持序列化场景(如通过 JSON 传 id)。
 * 在频繁 snapshot 时建议配合 reset() 避免内存增长。
 */
const idToElement = new Map<NodeId, Element>();

/** 重置全局 Element 映射,典型用例: 测试隔离。 */
export function resetElementMap(): void {
  idToElement.clear();
}

/** 给定 id 拿回 DOM Element;未注册时返回 null。 */
export function getElementById(id: NodeId): Element | null {
  return idToElement.get(id) ?? null;
}

/**
 * 判断元素是否"对用户可见"。
 *
 * 简化规则:
 *   - display:none → 不可见
 *   - visibility:hidden 或 visibility:collapse → 不可见
 *   - aria-hidden=true → 不可见
 *   - 零尺寸 + 元素子节点为空 + 无文本内容 → 不可见
 */
function isVisible(el: Element): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return false;

  const view = (el.ownerDocument ?? document).defaultView;
  if (!view || typeof view.getComputedStyle !== 'function') {
    return true; // 没有 layout 引擎,默认当作可见
  }
  const style = view.getComputedStyle(el as HTMLElement);
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;

  const rect = (el as HTMLElement).getBoundingClientRect?.();
  if (rect && rect.width === 0 && rect.height === 0) {
    const tag = el.tagName.toLowerCase();
    const isFormControl = ['input', 'button', 'select', 'textarea'].includes(tag);
    const hasText = (el.textContent ?? '').trim().length > 0;
    if (!isFormControl && el.children.length === 0 && !hasText) return false;
  }

  return true;
}

/** 是否被禁用(disabled 属性 或 aria-disabled="true") */
function isDisabled(el: Element): boolean {
  if ((el as HTMLInputElement).disabled) return true;
  if (el.getAttribute('aria-disabled') === 'true') return true;
  return false;
}

/**
 * 给一个元素打一些"非布尔状态"标签。
 * 形如 ['required'] / ['selected'] / ['expanded', 'collapsed']
 *
 * 注: disabled 和 checked 已经独立为顶级字段,这里不再包含。
 */
function collectStates(el: Element, role: AriaRole | null): string[] {
  const states: string[] = [];
  if (role === 'option') {
    if ((el as HTMLOptionElement).selected) states.push('selected');
  }
  if (el.hasAttribute('required') || el.getAttribute('aria-required') === 'true') {
    states.push('required');
  }
  const expanded = el.getAttribute('aria-expanded');
  if (expanded === 'true') states.push('expanded');
  if (expanded === 'false') states.push('collapsed');
  return states;
}

/**
 * 给 input/textarea/combobox 之类元素附加 value 字段。
 */
function collectValue(el: Element, role: AriaRole | null): string | undefined {
  if (!role) return undefined;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    return (el as HTMLInputElement).value;
  }
  return undefined;
}

/** heading 元素的级别 1-6 */
function headingLevel(el: Element): number | undefined {
  const tag = el.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) {
    return Number(tag[1]);
  }
  return undefined;
}

/** 指向性属性: a/area/link → href, img/iframe → src */
function collectHref(el: Element): string | undefined {
  const tag = el.tagName.toLowerCase();
  if (tag === 'a' || tag === 'area' || tag === 'link') {
    return el.getAttribute('href') ?? undefined;
  }
  if (tag === 'img' || tag === 'iframe') {
    return el.getAttribute('src') ?? undefined;
  }
  return undefined;
}

/**
 * 被 <label for="..."> 关联时,记录 label 元素的 id。
 * 仅对表单控件(textbox / combobox / listbox / spinbutton / searchbox)有意义。
 * 注意: label 的文本已经会通过 getAccessibleName 传递到 input.name,
 * 这里只多记录 label 元素的 id,让 LLM 知道 name 是"被绑过来"的。
 */
function collectLabeledBy(el: Element, role: AriaRole | null): string | undefined {
  if (
    role !== 'textbox' &&
    role !== 'combobox' &&
    role !== 'listbox' &&
    role !== 'spinbutton' &&
    role !== 'searchbox'
  ) {
    return undefined;
  }
  if (!el.id) return undefined;
  // 找带 for=el.id 的 label
  const doc = el.ownerDocument ?? document;
  const label = doc.querySelector(`label[for="${CSS.escape(el.id)}"]`);
  return label?.id || el.id; // label 自身无 id 时退化为 el.id
}

/**
 * radio 按钮的 group name。
 * 优先从 name 属性获取,否则在 fieldset[radiogroup] 内使用 fieldset 的 accessible name(legend 文本)。
 */
function collectRadioGroup(el: Element, role: AriaRole | null): string | undefined {
  if (role !== 'radio') return undefined;
  // 1) name 属性(W3C 标准)
  const name = el.getAttribute('name');
  if (name) return name;
  // 2) 祖先 fieldset[radiogroup] 的 accessible name
  const fieldset = el.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend) {
      const txt = (legend.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (txt) return txt;
    }
  }
  return undefined;
}

/** checkbox/radio/switch 的勾选状态,只在勾选时返回 true */
function collectChecked(el: Element, role: AriaRole | null): boolean | undefined {
  if (role !== 'checkbox' && role !== 'radio' && role !== 'switch') return undefined;
  return (el as HTMLInputElement).checked ? true : undefined;
}

/** 元素是否被禁用,只在禁用时返回 true */
function collectDisabled(el: Element): boolean | undefined {
  return isDisabled(el) ? true : undefined;
}

/** input/textarea 的 placeholder,只在非空时返回 */
function collectPlaceholder(el: Element, role: AriaRole | null): string | undefined {
  if (
    role !== 'textbox' &&
    role !== 'combobox' &&
    role !== 'listbox' &&
    role !== 'spinbutton' &&
    role !== 'searchbox'
  ) {
    return undefined;
  }
  const tag = el.tagName.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') return undefined;
  const p = el.getAttribute('placeholder');
  return p && p.trim() ? p : undefined;
}

/**
 * 元素的可见文本(textContent 折叠空白)。
 * 适用于"文本即是动作语义"的角色: button / link / option / tab / menuitem(及其 checkbox/radio 子类)。
 * 与 name 区分: name 是 accessible name(可来自 data-testid / aria-label),text 是元素真实可见文字。
 */
function collectText(el: Element, role: AriaRole | null): string | undefined {
  const TEXT_ROLES: ReadonlySet<string> = new Set([
    'button',
    'link',
    'option',
    'tab',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
  ]);
  if (!role || !TEXT_ROLES.has(role)) return undefined;
  const txt = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  return txt || undefined;
}

/** getBoundingClientRect,统一兜底 */
function collectRect(el: Element): SnapshotRect {
  const r = (el as HTMLElement).getBoundingClientRect?.();
  if (!r) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

/**
 * 核心: 给一个元素算 SnapshotNode;不符合条件返回 null。
 *
 * @param forced   当为 true 时,跳过 role 检查(用 tagName 兜底),
 *                 用于 include 选项强制纳入无 ARIA role 的元素
 * @param visible  元素是否视觉可见(由 walk 算好后传入,避免重复计算)
 */
function toSnapshotNode(
  el: Element,
  depth: number,
  root: Element | Document,
  forced: boolean = false,
  visible: boolean = true,
): SnapshotNode | null {
  // 永远跳过 <script> <style> <template>
  const tag = el.tagName.toLowerCase();
  if (['script', 'style', 'template', 'noscript', 'meta', 'link', 'title', 'head'].includes(tag)) {
    return null;
  }

  const roleOrNull = getRole(el);
  if (!roleOrNull && !forced) return null;

  const role: AriaRole = roleOrNull ?? (tag as AriaRole);
  const name = getAccessibleName(el, role, root);
  if (!name) return null;

  // 必填字段
  const node: SnapshotNode = {
    id: '',
    role,
    name,
    visible,
    rect: collectRect(el),
    depth,
  };

  // 可选字段 —— 按需附加,保持 JSON 最小化
  const value = collectValue(el, role);
  if (value !== undefined) node.value = value;
  const level = headingLevel(el);
  if (level) node.level = level;
  const href = collectHref(el);
  if (href) node.href = href;
  const checked = collectChecked(el, role);
  if (checked) node.checked = true;
  const disabled = collectDisabled(el);
  if (disabled) node.disabled = true;
  const placeholder = collectPlaceholder(el, role);
  if (placeholder) node.placeholder = placeholder;
  const text = collectText(el, role);
  if (text) node.text = text;
  const labeledBy = collectLabeledBy(el, role);
  if (labeledBy) node.labeledBy = labeledBy;
  const radioGroup = collectRadioGroup(el, role);
  if (radioGroup) node.radioGroup = radioGroup;
  const states = collectStates(el, role);
  if (states.length > 0) node.states = states;

  return node;
}

/**
 * 递归遍历 DOM,产出节点数组 + 统计 + 元信息。
 *
 * @param root  扫描根
 * @param opts  配置项
 * @returns SnapshotResult (含 nodes/stats/meta)
 */
export function snapshot(root?: Element | Document, opts: SnapshotOptions = {}): SnapshotResult {
  const startNode: Element | Document = root ?? document.body ?? document;
  const {
    include = [],
    exclude = [],
    visibleOnly = true,
    interactiveOnly = true,
    maxDepth = Infinity,
  } = opts;

  // include Selector 一次性预解析,放一个 Set 里命中判断
  const includeEls = new Set<Element>();
  const excludeEls = new Set<Element>();
  const doc = (startNode as Element).ownerDocument ?? document;
  for (const sel of include) {
    doc.querySelectorAll(sel).forEach((e) => includeEls.add(e));
  }
  for (const sel of exclude) {
    doc.querySelectorAll(sel).forEach((e) => excludeEls.add(e));
  }

  const out: SnapshotNode[] = [];
  let counter = 0;

  function walk(node: Element, depth: number) {
    if (depth > maxDepth) return;

    // 排除优先级最高
    if (excludeEls.has(node)) return;

    const forced = includeEls.has(node);
    const actualVisible = isVisible(node);
    // 是否允许纳入:受 visibleOnly 控制
    const acceptByVisible = !visibleOnly || actualVisible;

    // 注意: disabled 元素不再过滤,而是通过 `disabled: true` 字段标注
    if (forced || acceptByVisible) {
      const role = getRole(node);
      const interactive = isInteractiveRole(role);
      const semantic = isSemanticRole(role);

      let accept = false;
      if (forced) {
        accept = true;
      } else if (interactiveOnly) {
        accept = interactive;
      } else {
        accept = interactive || semantic;
      }

      if (accept) {
        // visible 字段如实记录,不受 visibleOnly 控制
        const snap = toSnapshotNode(node, depth, startNode, forced, actualVisible);
        if (snap) {
          counter += 1;
          snap.id = `e${counter}`;
          out.push(snap);
          idToElement.set(snap.id, node);
        }
      }
    }

    // 继续向下递归(子元素继承 depth+1)
    for (const child of Array.from(node.children)) {
      walk(child, depth + 1);
    }
  }

  // 从根节点的子元素开始(根本身通常不参与,避免 <html> 这种空 role 节点污染)
  if (startNode.children) {
    for (const child of Array.from(startNode.children)) {
      walk(child, 1);
    }
  } else {
    // Document 没有 children,回退
    walk((startNode as Document).documentElement ?? (startNode as Document).body, 1);
  }

  // 构造 stats
  const byRole: Record<string, number> = {};
  let visible = 0;
  for (const n of out) {
    byRole[n.role] = (byRole[n.role] ?? 0) + 1;
    if (n.visible) visible += 1;
  }
  const stats: SnapshotStats = {
    total: out.length,
    visible,
    byRole,
    approxChars: JSON.stringify(out).length,
  };

  // 构造 meta
  const sourceUrl: string | null =
    typeof document !== 'undefined' && document.location ? document.location.href : null;
  const meta: SnapshotMeta = {
    untrusted: true,
    sourceUrl,
    capturedAt: new Date().toISOString(),
    version: LIB_VERSION,
  };

  return { nodes: out, stats, meta };
}
