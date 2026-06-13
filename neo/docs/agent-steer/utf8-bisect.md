# Agent Steer Chrome 扩展: "not UTF-8 encoded" 二分调试

## 背景

`agent-steer-recording` change 在 Chrome 里 Load unpacked 时报:

```
Failed to load extension
File /path/to/.output/chrome-mv3
Error: Could not load file 'content-scripts/content.js' for content script.
       It isn't UTF-8 encoded.
Could not load manifest.
```

build 侧已穷尽所有验证 (file / iconv / Node TextDecoder / Perl 字节级 / Python 字节级),产物 100% 合法 UTF-8。Playwright headless 无法复现 (headless 不支持扩展加载),真实 Chrome 复现稳定。

## 最可能的元凶 (按可疑度排序)

| # | 嫌疑 | 字节证据 |
|---|------|----------|
| 1 | **postcss 的中文 deprecation 警告** | `91cc 9762 ... 5357` = "里面 postcss.plugin 被弃用" |
| 2 | **`\ufeff` / `\ufffe` 字符字面量** | postcss BOM 检测代码里的 `this.css[0] === "\ufeff"` |
| 3 | **rrweb 库** | alpha 版本可能有未知问题 |
| 4 | **192KB 大文件** | Chrome 可能有未公开大小启发式 |
| 5 | **WXT 0.20.26 的 IIFE wrapper** | `var content=(function()...)()` 包装 |

## 调试方法: 二分隔离 (bisect)

从**已知能工作的干净工程**开始,**逐步加东西**直到报错。每个 checkpoint 后做 Load unpacked 测试。

### 测试通过标准

Chrome 里:
- Load unpacked → 无错误
- chrome://extensions/ 里扩展显示"无错误"
- 点 "Service Worker" → console 无错误
- popup 能弹出来(后续步骤)

### 测试失败标准

任何一步 Load unpacked 报"not UTF-8 encoded" → 停。这步加的东西就是嫌疑。

## 顺序 (10 步)

### Step 1: WXT 最小工程 (基线)

```bash
# 用 pnpm + WXT 0.20.26 初始化
mkdir bisect && cd bisect
pnpm init
pnpm add -D wxt @wxt-dev/module-react
mkdir -p entrypoints
```

`entrypoints/background.ts`:
```ts
export default defineBackground(() => {
  console.log("hi bg");
});
```

`wxt.config.ts`:
```ts
import { defineConfig } from 'wxt'
export default defineConfig({ modules: [] })
```

```bash
pnpm wxt build
# 验证: Load unpacked → 应该成功
```

**预期: ✓ 通过** (确认 WXT 本身没问题)

### Step 2: 加 content script

`entrypoints/content.ts`:
```ts
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  main() {
    console.log('hi content');
  },
});
```

```bash
pnpm wxt build
# 验证: Load unpacked → 应该成功
```

**预期: ✓ 通过** (确认 content script 框架没问题)

### Step 3: content script matches + run_at 复杂化

```ts
export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: false,  // ← 加这个
  runAt: 'document_start',
  main() { console.log('hi content'); },
});
```

```bash
pnpm wxt build
# 验证
```

**预期: ✓ 通过**

### Step 4: 加 React (popup 框架)

```bash
pnpm add react react-dom
pnpm add -D @wxt-dev/module-react @vitejs/plugin-react @types/react @types/react-dom
```

`entrypoints/popup.html`:
```html
<!doctype html>
<html><body><div id="root"></div></body></html>
```

`entrypoints/popup/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
export default defineUnlistedScript(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<div>hi popup</div>)
})
```

`wxt.config.ts`:
```ts
import { defineConfig } from 'wxt'
export default defineConfig({ modules: ['@wxt-dev/module-react'] })
```

`manifest.json` 需加 popup action (WXT 自动加,确认下 manifest.json 里 action 存在)。

```bash
pnpm wxt build
# 验证: Load unpacked + 点 popup → 应该看到 "hi popup"
```

**预期: ✓ 通过** (确认 React 集成没问题)

### Step 5: 加 rrweb 依赖

```bash
pnpm add rrweb
```

`entrypoints/content.ts`:
```ts
import { record } from 'rrweb'
export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_start',
  main() {
    record({ emit: () => {} });  // 启动 rrweb,不存事件
  },
});
```

```bash
pnpm wxt build
# 验证
```

**预期: ✓ 通过** (rrweb 库本身一般不会触发 UTF-8 问题)

### Step 6: 加 Tailwindcss (关键嫌疑!)

```bash
pnpm add -D tailwindcss@3.4.19 postcss autoprefixer
```

`tailwind.config.js`:
```js
module.exports = { content: ['./entrypoints/**/*.{ts,tsx,html}'], theme: {}, plugins: [] }
```

`postcss.config.js`:
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`entrypoints/popup.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`entrypoints/popup/main.tsx` 顶部加:
```tsx
import './popup.css'
```

```bash
pnpm wxt build
# 验证: 关键! 这一步很可能报 UTF-8 错误
# 如果报错,嫌疑基本锁定 → 跳到 [调查方向 A]
```

**预期: ✗ 报错 ← 大概率命中**

### Step 7-8: 跳过 (如果 Step 6 通过)

Step 7: 加完整的 popup UI 代码
Step 8: 加 IndexedDB / messaging / controller

按需。

## 调查方向 (Step 6 命中后)

### 方向 A: Tailwindcss 排除

尝试**不加 Tailwind 也能复现吗?** 把 Step 6 的 `tailwind.config.js` 和 `postcss.config.js` 删了,只保留:

```bash
pnpm add -D postcss
```

`postcss.config.js`:
```js
module.exports = { plugins: {} }
```

如果还报错 → postcss 自身问题。如果不报错 → Tailwindcss 引入的问题。

### 方向 B: 字符具体定位

如果 Step 6 报错,在**报错的 build 输出**里 dump 内容脚本的字节,找**非 ASCII 字节**:

```bash
perl -ne 'while (/(.)/g) { my $b = ord($1); printf "%d: 0x%02X\n", $., $b if $b > 127 }' .output/chrome-mv3/content-scripts/content.js | head -30
```

看哪些非 ASCII 字节在可疑位置。

### 方向 C: 完全不用 WXT 的 wrapper

如果 WXT 的 IIFE wrapper 是问题,**手动 build content script**:

`scripts/build-content.mjs`:
```js
import { build } from 'esbuild'
await build({
  entryPoints: ['./content-source.ts'],
  bundle: true,
  outfile: './.output/chrome-mv3/content-scripts/content.js',
  format: 'iife',
  target: 'es2020',
  platform: 'browser',
})
```

在 manifest.json 里直接引用这个 plain IIFE 文件,**不经过 WXT**。

## 报告格式

每步完成后告诉我:

1. **通过了 / 报错了** (pass/fail)
2. 如果报错:**完整错误文本**(从 Chrome 对话框 copy 原文)
3. 如果报错:build 输出的 `wc -c` 大小
4. 如果报错:该步新增的依赖列表

## 数据收集

每步记录:
- 文件大小
- 是否有 `中文 / CJK 字符`
- 是否有 `\ufeff` / `\ufffe`
- Load unpacked 结果

发现报错步骤后,**这步之前的最后通过步骤**就是稳定基线,**报错的步骤加的东西**就是嫌疑范围。
