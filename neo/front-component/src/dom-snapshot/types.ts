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
 * 业务标注类型枚举。
 * 用于标识元素的重要性和业务含义。
 */
export type BusinessType =
  /** 危险操作，如删除、取消等不可逆操作 */
  | 'dangerous-action'
  /** 敏感数据操作，如输入密码、验证码等 */
  | 'sensitive-data'
  /** 重要操作，如提交订单、支付等 */
  | 'important-action'
  /** 导航操作，如跳转页面 */
  | 'navigation'
  /** 表单输入，如文本输入 */
  | 'form-input'
  /** 自定义业务类型(兜底) */
  | (string & {});

/**
 * 业务标注信息。
 *
 * 通过在 HTML 元素上添加 data-ai-* 属性来提供业务上下文:
 * ```html
 * <button data-ai-desc="请谨慎操作" data-ai-type="dangerous-action">删除订单</button>
 * <input data-ai-context="收货人手机号" data-ai-type="form-input" />
 * ```
 *
 * 这些信息会被 snapshot() 自动收集并附加到节点上。
 */
export interface BusinessAnnotation {
  /** 业务描述,人类可读的操作说明
   * data-ai-desc="请谨慎操作" */
  desc?: string;
  /** 业务类型,标识元素的业务含义
   * data-ai-type="dangerous-action" */
  type?: BusinessType;
  /** 业务上下文,用于表单字段的语义说明
   * data-ai-context="收货人手机号" */
  context?: string;
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
  /** 被 <label for="..."> 关联时,记录 label 元素的 id(可选) */
  labeledBy?: string;
  /** radio 按钮的 group name(name 属性值,可选) */
  radioGroup?: string;
  /** 元素其他状态: required / expanded / collapsed / selected(可选) */
  states?: string[];
  /** DOM 树中的深度,调试用(可选) */
  depth?: number;
  /** 业务标注信息,来自 data-ai-* 属性(可选)
   * 当元素有业务语义时提供,帮助 LLM 理解元素的业务含义 */
  business?: BusinessAnnotation;
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
 * snapshot 输出的统计信息,供 LLM 评估 token 成本。
 */
export interface SnapshotStats {
  /** 节点总数 */
  total: number;
  /** 其中 visible=true 的节点数 */
  visible: number;
  /** 按 role 分类计数,例如 { button: 5, textbox: 3, label: 2 } */
  byRole: Record<string, number>;
  /** 序列化后的近似字符数(LLM token 估算依据) */
  approxChars: number;
}

/**
 * snapshot 捕获时的元信息。
 *
 * `untrusted: true` 是一个安全提示: snapshot 内容来自外部页面,
 * LLM 消费时应视为不可信(防御 prompt injection)。
 */
export interface SnapshotMeta {
  /** 始终 true,作为 LLM 的安全标志 */
  untrusted: true;
  /** 捕获时所在 URL(只读自 document;Element 根传 null) */
  sourceUrl: string | null;
  /** ISO 8601 捕获时间 */
  capturedAt: string;
  /** 库版本 */
  version: string;
}

/**
 * snapshot() 的完整返回结构(v0.2 breaking change)。
 */
export interface SnapshotResult {
  /** 节点数组(深度优先顺序) */
  nodes: SnapshotNode[];
  /** 统计信息 */
  stats: SnapshotStats;
  /** 元信息(untrusted 标志 + 来源) */
  meta: SnapshotMeta;
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
