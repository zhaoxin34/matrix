/**
 * @neo/dom-snapshot
 *
 * 把任意 DOM 树压缩成 LLM 友好的扁平结构 (id/role/name),
 * 并提供 click/fill 双向操作能力。
 *
 * 设计哲学:
 *   - 单一职责: 只关心"语义 + 可达性",不关心样式、不关心定位
 *   - 框架无关: 任何能跑 JS 的浏览器环境都能用
 *   - 可读性优先: 输出格式贴近 agent-browser 等成熟工具
 */

export { snapshot, getElementById, resetElementMap } from './snapshot.js';
export { click, fill } from './operations.js';
export {
  getRole,
  isInteractiveRole,
  isContentRole,
  isStructuralRole,
  isSemanticRole,
} from './role.js';
export { getAccessibleName, normalizeName } from './name.js';

export type { NodesInput } from './operations.js';
export type {
  NodeId,
  AriaRole,
  SnapshotNode,
  SnapshotOptions,
  ScannedElement,
  OperationResult,
  SnapshotStats,
  SnapshotMeta,
  SnapshotResult,
} from './types.js';
