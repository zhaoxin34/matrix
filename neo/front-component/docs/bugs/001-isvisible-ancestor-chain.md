# Bug 001: isVisible 漏检祖先链,隐藏容器内的元素全部进入 snapshot

| 字段 | 值 |
|---|---|
| 发现时间 | 2026-06-14 |
| 严重度 | **P1**(真实场景下所有隐藏内容泄漏到 LLM) |
| 影响版本 | v0.1.0 – v0.2.0 |
| 修复版本 | v0.2.1(commit 92baa99b) |
| 发现方式 | 用户实际使用 demo 反馈 |
| 引入 commit | a43fa530(Phase 1) |
| 引入原因 | 测试覆盖盲区 |

## 症状

demo 改造成 4 个 tab 后,在「基础」tab 触发 snapshot,JSON 输出**包含全部 23 个元素**,包括属于「容器」「弹窗」「状态」tab 里的所有控件。

**期望**:只在活跃 tab 的元素进入 snapshot(其他 tab 用 `display:none` 隐藏)。

**实际**:所有 tab 的元素都被收集,LLM 看到"当前页面上有 7 个 radio 按钮",但实际只有当前 tab 是可见的。

## 复现路径

```html
<div id="root">
  <button data-testid="b-outer">可见</button>
  <div style="display: none;">
    <button data-testid="b-hidden1">隐藏容器里的</button>
    <button data-testid="b-hidden2">隐藏容器里的</button>
  </div>
</div>
```

```ts
const { nodes } = snapshot(root);
// 期望: nodes 长度 1 (只有 b-outer)
// 实际: nodes 长度 3 (b-outer + b-hidden1 + b-hidden2)
```

## 根因

`isVisible()` 之前只检查元素**自身**的 `display` / `visibility`:

```ts
// 修复前
function isVisible(el: Element): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return false;
  // ...
  const style = view.getComputedStyle(el as HTMLElement);
  if (style.display === 'none') return false;  // ← 只查自己
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  // ...
}
```

**漏检**:当祖先元素 `display:none` 时,后代元素本身的 `display` 属性可能仍然是默认值(如 `inline-block`),但视觉上不可见。

我之前在写测试时**只测了"元素自身 `display:none`"的场景**(`<button style="display:none">`),没测过"祖先 `display:none`"的场景(`<div style="display:none"><button>x</button></div>`)。这种 tab 容器、折叠面板、Modal 关闭态都属于"祖先隐藏"模式。

## 修复

沿 `parentElement` 链向上检查,任何一个祖先 `display:none` / `visibility:hidden` 都会让整个子树不可见。

```ts
// 修复后
function isVisible(el: Element): boolean {
  if (el.getAttribute('aria-hidden') === 'true') return false;
  // ...

  // 检查自身 + 祖先链
  let cur: Element | null = el;
  while (cur) {
    // 1) getComputedStyle(真实浏览器)
    const s = view.getComputedStyle(cur as HTMLElement);
    if (s.display === 'none') return false;
    if (s.visibility === 'hidden' || s.visibility === 'collapse') return false;
    // 2) 兜底读 raw style attribute(happy-dom 不解析 inline style)
    const styleAttr = (cur.getAttribute('style') ?? '').toLowerCase().replace(/\s+/g, ' ');
    if (/(?:^|;)\s*display\s*:\s*none\s*(?:;|$)/.test(styleAttr)) return false;
    if (/(?:^|;)\s*visibility\s*:\s*(?:hidden|collapse)\s*(?:;|$)/.test(styleAttr)) return false;
    cur = cur.parentElement;
  }
  // ...
}
```

### 修复中遇到的两个 happy-dom quirk

1. **`el.style.display` 不可靠**:happy-dom 不解析 `style` 属性的 CSSStyleDeclaration,设了 `el.style.display = 'none'` 之后 `el.style.display` 仍返回 `""`。所以额外读 raw `getAttribute('style')` 字符串。
2. **`getComputedStyle` 部分实现**:happy-dom 15 在直接 `el.style.display = 'none'` 时能正确返回 `'none'`,但用 HTML 字符串解析(`<div style="display:none">`)时不行。两种方式都加上以兼容。

## 测试覆盖

新增 3 个测试,放在 `tests/snapshot.test.ts` 的 "必填字段 visible/rect" describe 里:

```ts
it('祖先 display:none 时,内部元素不进 snapshot (visibleOnly=true 默认过滤)', () => {
  // 默认 visibleOnly=true,hidden 元素应被过滤
});

it('visibleOnly=false 时,隐藏元素进 snapshot 但 visible:false', () => {
  // 验证另一个语义:visibleOnly=false 仍纳入但标记 visible=false
});

it('3 层嵌套 display:none 也能正确过滤', () => {
  // 验证多层级
});

it('祖先链 visibility:hidden 也能过滤', () => {
  // 验证 visibility 也有相同问题
});
```

## 教训 / Takeaway

### 1. 递归语义必须测"跨层级"

**凡是"属于 X 才算"的判定,都要测 X 的间接情形**。这次:
- isVisible 是"元素是否视觉可见"的判定
- 我只测了"元素自己不可见"的情形
- 漏了"祖先不可见导致元素不可见"的情形

类似的潜在盲区(值得检查):

| 函数 | 现在的测试 | 潜在盲区 |
|---|---|---|
| `isVisible` | 自身 display / 自身 aria-hidden | 祖先链显示状态 |
| `isDisabled` | 自身 disabled / aria-disabled | **祖先 fieldset[disabled]**! |
| `isInteractiveRole` | role 匹配 | 无明显盲区 |
| `getRole` | 显式 role / tagName 映射 | 显式 role 覆盖 — 已覆盖 |
| `getAccessibleName` | data-testid / label / textContent | 祖先 `aria-labelledby` 链(已实现) |
| `collectLabeledBy` | 简单 label[for] | label 包裹 input(已测试) |
| `collectRadioGroup` | name 属性 / fieldset legend | `<label>包 radio` 时的 name 传递(未测) |

**`isDisabled` 的祖先链检查**特别值得跟进:W3C 规范说 `<fieldset disabled>` 会禁用所有后代表单控件,但目前我的实现只看 `el.disabled` 和 `aria-disabled="true"`,**没看祖先 fieldset**。这个 bug 暂时没暴露,但实际项目里很常见。

### 2. 真实场景比单元测试重要

v0.1 + v0.2 加起来 153 个测试,但**没有一个测试覆盖"tab 容器 + 隐藏"这个真实场景**。因为写测试时脑子里想的是"测 isVisible",而不是"测 snapshot 在真实 demo 里是否正确"。

**建议**:
- 每个 release 至少跑一次"真实页面 + 真实交互"的端到端冒烟
- 端到端测试用例写在 `tests/e2e/` 或 demo 里的 `?_test=` 模式
- 重要 fix 上线前,先在 dev server 里手验一次

### 3. happy-dom / jsdom / 真实浏览器的差异要测三遍

库的"快照"API 强依赖 DOM 行为,不同测试环境的实现差异会导致:
- 这次的 `el.style.display` 在 happy-dom 不生效
- 真实浏览器没问题
- jsdom 行为介于两者之间

**建议**:
- 关键 DOM 行为用真实浏览器跑一遍 e2e(我目前的 agent-browser 验证流程已经做到)
- 单元测试接受 happy-dom 的 limitation,在测试里**显式用 `setAttribute` 或 `el.style.xxx =`** 而不是依赖 HTML 字符串解析

## 预防 CheckList

给后续的类似功能(visibility、disabled、aria-*)一个检查模板:

- [ ] 自身属性 — 元素自己的属性/状态
- [ ] 显式覆盖 — 元素的显式 aria-* / data-* 覆盖
- [ ] **祖先链** — 祖先元素的影响(常被遗漏)
- [ ] CSS 样式 — display / visibility / opacity
- [ ] 边界 — 零尺寸 / 空内容 / disabled 自身
- [ ] 环境兼容 — happy-dom / 真实浏览器 / 移动端

## 相关 Commit

- 引入: `a43fa530` (v0.2 Phase 1)
- 发现: 用户报告(commit 92baa99b 之前的会话)
- 修复: `92baa99b` (refactor: demo 拆 4 tab + bugfix isVisible 祖先链检查)

## 后续跟踪

- [ ] 给 `isDisabled` 加同样的祖先链检查(尤其是 `<fieldset disabled>`)
- [ ] 写一份"DOM 行为差异速查表"在 `docs/`,记录 happy-dom / jsdom / 真实浏览器的差异点
- [ ] v0.3 给 snapshot 加 e2e 模式(用 Playwright 跑真实 Chromium),把这种 bug 拦在 CI

---

**记录人**: 跟用户一起复盘
**格式**: 这是第一份 bug post-mortem,后续 bug 用 `docs/bugs/00N-*.md` 编号
