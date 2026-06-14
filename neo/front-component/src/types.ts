/**
 * 公共类型定义
 *
 * SnapshotNode 是库的核心输出结构,LLM 拿到这个数组就能
 * 完整理解当前页面的"可操作元素清单"。
 */

/**
 * 节点 id 前缀。agent-browser 用 e1/e2/... 形式,
 * 我们保持一致以便 LLM 训练样本兼容。
 */
export type NodeId = string;

/**
 * 元素的 ARIA 角色。
 *
 * 优先使用 W3C 标准 role 名,无 ARIA 对应时返回原始 tagName 的
 * 小写形式 (例如 'div'、'span')。
 *
 * 分类层级(参考 WAI-ARIA 1.2 + browserclaw 的 INTERACTIVE / CONTENT / STRUCTURAL 三分法):
 *   - INTERACTIVE: 用户可直接操作的控件(button/textbox/checkbox/...)
 *   - CONTENT:     语义内容(heading/label/cell/landmark/...)
 *   - STRUCTURAL:  纯容器,价值在子元素(group/radiogroup/list/table/...)
 */
export type AriaRole =
  // ── INTERACTIVE ──
  | 'button'
  | 'link'
  | 'textbox'
  | 'searchbox'
  | 'checkbox'
  | 'radio'
  | 'combobox'
  | 'listbox'
  | 'option'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'tab'
  | 'treeitem'
  | 'switch'
  | 'slider'
  | 'spinbutton'
  | 'dialog'
  // ── CONTENT ──
  | 'heading'
  | 'label'
  | 'img'
  | 'cell'
  | 'gridcell'
  | 'columnheader'
  | 'rowheader'
  | 'listitem'
  | 'article'
  | 'form'
  | 'region'
  | 'progressbar'
  // CONTENT landmarks
  | 'navigation'
  | 'main'
  | 'banner'
  | 'contentinfo'
  | 'search'
  | 'complementary'
  // ── STRUCTURAL ──
  | 'group'
  | 'radiogroup'
  | 'list'
  | 'menu'
  | 'menubar'
  | 'toolbar'
  | 'tablist'
  | 'table'
  | 'row'
  | 'rowgroup'
  | 'grid'
  | 'tree'
  | 'treegrid'
  | 'directory'
  | 'document'
  | 'application'
  | 'generic'
  | 'presentation'
  | 'none'
  // 兜底: 元素的 tagName (小写)
  | (string & {});

/**
 * 元素在视口中的位置与尺寸。
 * 来自 getBoundingClientRect。
 */
export interface SnapshotRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Snapshot 输出的一条记录。
 *
 * 必填字段: id / role / name / visible / rect —— 对 LLM 始终可用。
 * 可选字段: 只在元素有相应语义时附带,避免 LLM 接收噪声。
 */
export interface SnapshotNode {
  /** 稳定的引用 id,形如 e1/e2/... */
  id: NodeId;
  /** ARIA 角色,例如 button/textbox/heading */
  role: AriaRole;
  /** 元素的 accessible name (人类可读标签) */
  name: string;
  /** 元素是否视觉可见(display/visibility/尺寸判断) */
  visible: boolean;
  /** 元素在视口中的位置和尺寸 */
  rect: SnapshotRect;
  /** input/textarea 当前的值(可选) */
  value?: string;
  /** heading 级别 1-6(可选) */
  level?: number;
  /** href / src / 等指向性属性(可选) */
  href?: string;
  /** checkbox/radio/switch 的勾选状态,只在勾选时为 true(可选) */
  checked?: boolean;
  /** 元素是否被禁用(disabled 属性或 aria-disabled),只在禁用时为 true(可选) */
  disabled?: boolean;
  /** input/textarea 的 placeholder(可选) */
  placeholder?: string;
  /** 元素可见文本(textContent 折叠空白),仅在 button / link / option / tab / menuitem 等上有值(可选)
   *  与 name 区分: name 是 accessible name(可来自 data-testid/aria-label),text 是元素真实可见文字 */
  text?: string;
  /** 元素其他状态: required / expanded / collapsed / selected(可选) */
  states?: string[];
  /** DOM 树中的深度,调试用(可选) */
  depth?: number;
}

/**
 * snapshot() 的配置项。
 */
export interface SnapshotOptions {
  /** 扫描根节点,默认 document.body */
  root?: Element | Document;
  /** 强制纳入的 CSS Selector(绕过可见性/交互性过滤) */
  include?: string[];
  /** 强制排除的 CSS Selector */
  exclude?: string[];
  /** 跳过不可见元素,默认 true */
  visibleOnly?: boolean;
  /** 只保留可交互元素,默认 true;设为 false 会同时包含 CONTENT(heading/label/cell/...) */
  interactiveOnly?: boolean;
  /** 限制遍历深度,默认无限 */
  maxDepth?: number;
}

/**
 * 内部遍历时携带的"原始元素 + 已计算字段",最终转换成 SnapshotNode。
 */
export interface ScannedElement {
  el: Element;
  role: AriaRole | null;
  name: string | null;
}

/**
 * click/fill 的返回结果。
 */
export interface OperationResult {
  ok: boolean;
  id: NodeId;
  message?: string;
}
