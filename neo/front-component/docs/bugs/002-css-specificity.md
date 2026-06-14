# Bug 002: .tab 文字看不见 —— CSS 特异性 bug

| 字段 | 值 |
|---|---|
| 发现时间 | 2026-06-14 |
| 严重度 | **P2**(视觉缺陷,功能不受影响) |
| 影响版本 | v0.2.0 之后(commit a43fa530 引入 4 tab 重构后) |
| 修复版本 | 47d93a32 |
| 发现方式 | 用户反馈"字体颜色和背景色一致" |
| 引入 commit | 92baa99b(4 tab 重构时的 style.css) |
| 引入原因 | CSS 特异性顺序没测 |

## 症状

demo 改成 4 个 tab 后,active tab(基础)**文字完全看不见**。

`agent-browser` 实测 `getComputedStyle`:
```json
{
  "color": "rgb(59, 130, 246)",        // ← 蓝字 (--primary)
  "background": "rgb(59, 130, 246)",  // ← 蓝底 (--primary)
  "fontWeight": "400"
}
```

**蓝字 + 蓝底 = 100% 不可见**。

## 复现路径

任何 tab 在 active 状态:`color: var(--primary)`(蓝),但同时 `background-color` 也是 `var(--primary)`(蓝)。

## 根因

style.css 里**两条规则在打架**:

```css
/* 规则 A: 通用规则,作用于 .demo-site 内所有 button(特异性 0,1,1) */
.demo-site button {
  background: var(--primary);
  color: white;
  border: 1px solid var(--primary);
  /* ... */
}

/* 规则 B: tab 专属(特异性 0,1,0) */
.tab {
  background: transparent;
  color: var(--muted);
  /* ... */
}

/* 规则 C: active tab(特异性 0,2,0) */
.tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
```

**特异性比较**:

| 规则 | 选择器 | 特异性 |
|---|---|---|
| A | `.demo-site button` | 0,1,1 |
| B | `.tab` | 0,1,0 |
| C | `.tab.active` | 0,2,0 |

C 胜 A(active 文字变蓝,✅)
B **败** A(tab 背景变成蓝,❌)
C 没设 background,所以 background 沿用 A 的 var(--primary)= 蓝

最终:`color: 蓝` + `background: 蓝` = 文字消失。

## 修复

提升 B 规则的特异性,让它压过 A:

```css
/* 修复后 */
.demo-site .tab {           /* 0,2,0 > 0,1,1 胜出 */
  background: transparent;
  color: var(--muted);
  /* ... */
}

.demo-site .tab.active {    /* 0,3,0 更稳 */
  color: var(--primary);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

.demo-site .tab:hover {
  color: var(--text);
  background: rgba(59, 130, 246, 0.06);  /* 浅蓝底 hover 反馈 */
}
```

修复后实测:
```json
{
  "color": "rgb(59, 130, 246)",
  "background": "rgba(0, 0, 0, 0)",   // ← 透明
  "fontWeight": "600"
}
```

## 其他可选修法(没采用)

### A. 限定通用规则作用域

```css
/* 改前 */
.demo-site button { ... }

/* 改后:用 > 直接子选择器 */
.demo-site > button { ... }
```

但 tab 不是 `.demo-site` 的直接子元素,而是 `.demo-site > .tabs > .tab`,所以 `>` 不行。
需改成 `.demo-site > div > div > button` —— 太脆弱,DOM 一变就废。

### B. 用 `:not()` 排除

```css
.demo-site button:not(.tab) { ... }
```

可行但丑,需要在通用规则里知道例外。

### C. `!important`

```css
.tab { background: transparent !important; }
```

能用但 `!important` 是 hack,后续维护会咬人。

### D. CSS Cascade Layers

```css
@layer reset, components, overrides;
@layer components {
  .demo-site button { background: var(--primary); }  /* 0,1,1 */
}
@layer overrides {
  .tab { background: transparent; }                   /* 0,1,0 但 layer 更高 */
}
```

最干净但需要现代浏览器 + 项目级 CSS 体系支持。目前 demo 工程不引入。

### 选定方案:方案 A 的变体(`.demo-site .tab`)

最直接,改动最小,后续加新 tab 不会踩。

## 教训 / Takeaway

### 1. 跟 Bug 001 同一类——"通用 vs 局部"边界没测

| Bug | 通用规则 | 局部规则 | 漏的边界 |
|---|---|---|---|
| 001 isVisible | `el.display === 'none'` | 父元素 display | 父链不可见时如何 |
| 002 CSS | `.demo-site button` 蓝底 | `.tab` 透明 | tab 是 button 的子集时的覆盖 |

**这是一个 bug 模式**:
1. 你写了一个通用规则(覆盖一类元素)
2. 你写了一个局部规则(覆盖子集)
3. 你只测了**独立**的情况,**没测两个规则在同一个元素上同时生效**的情况
4. **bug 出现**:通用规则赢了,局部规则失效

### 2. 视觉缺陷 bug 特别难自测

我之前在跑 153 个测试时,所有功能都通过了。但 CSS 这种"看不看得见"的问题,**单元测试根本测不到**。

**对策**:
- 每个改 CSS 的 commit,**必须在真实浏览器里截图**
- agent-browser 集成测试流程正好能做这件事
- 写个 e2e 工具:每次 CI 跑 demo 截图 + diff 像素,防止退化

### 3. 测计算样式,不止看 getComputedStyle

`getComputedStyle().backgroundColor === 'rgb(59, 130, 246)'` 应该是 **warning**,但单元测试不写这个就发现不了。

**对策**:
- 视觉关键组件(导航/状态/反馈)在测试里加 computed style 断言
- 例如:`expect(getComputedStyle(activeTab).color).not.toBe(getComputedStyle(activeTab).backgroundColor)`

### 4. 写 CSS 的"3 个原则"(给以后的自己)

- **新元素 ≠ 通用规则的扩展** —— 写新组件时,**先看父级有没有 `XXX button` 之类的通用规则**,主动避开
- **特异性数字要记住** —— 1 个 class + 1 个 element = `0,1,1`,比单 class (`0,1,0`) 高 1 级
- **不要用 `!important` 修 bug** —— 一定是因为特异性没想清楚

## 预防 CheckList(扩充 001)

- [ ] 自身属性 — 元素自己的属性/状态
- [ ] 显式覆盖 — 元素的显式 aria-* / data-* 覆盖
- [ ] **祖先链** — 祖先元素的影响(常被遗漏)
- [ ] CSS 样式 — display / visibility / opacity
- [ ] 边界 — 零尺寸 / 空内容 / disabled 自身
- [ ] 环境兼容 — happy-dom / 真实浏览器 / 移动端
- [ ] **CSS 特异性** — 新元素 vs 已有通用规则,主动测试覆盖优先级
- [ ] **计算样式** — 关键视觉元素加 getComputedStyle 断言(color ≠ background)
- [ ] **真实浏览器截图** — 每个改 CSS 的 commit 附截图,reviewer 看截图

## 相关 Commit

- 引入: `92baa99b`(4 tab 重构时的 style.css)
- 修复: `47d93a32`

## 后续跟踪

- [ ] 给 demo 写个"CSS 边界用例检查"脚本(agent-browser 跑真实样式)
- [ ] 思考:整个工程的 button 通用规则是不是过宽?要不要拆成 `.btn-primary` / `.btn-ghost` 显式类
- [ ] 在 docs/CONTRIBUTING.md(未来)加一条 "改 CSS 时必看父级规则"
- [ ] v0.3 引入 CSS cascade layers,从根本上避免这类问题

---

**记录人**: 跟用户一起复盘
**格式**: 沿用 Bug 001 模板,扩充 CheckList
