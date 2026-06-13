# Agent Steer Chrome 扩展: UTF-8 Bisect 调试 Check-List

> 一边调试一边记录,免得上下文丢失。

## 任务目标

坏工程 (`chrome-extension/`) Chrome Load unpacked 时报:
```
Could not load file 'content-scripts/content.js' for content script.
It isn't UTF-8 encoded.
Could not load manifest.
```

build 侧所有工具都验证文件合法 UTF-8,需要在干净工程里二分复现。

## 已做的事 (按时间顺序)

- [x] **基线建立**: 创建干净工程 `agent-steer/` (WXT 0.20.26 + React + popup, 无 rrweb)
  - 基线 build: 213KB, content script **3.44KB, ASCII**
  - commit: `9b6e07e9`
- [x] **Step 2 (加 rrweb)**: 装 rrweb@2.0.0-alpha.20, content script 调用 `record({emit:()=>{}})`
  - 结果: content script 183.6KB
  - **关键发现**: 即使没加 Tailwind,光 rrweb 本身就贡献了 **18 个 CJK 字符** + **2 个 `\ufeff`** + **2 个 `\ufffe`**
  - commit: `9487ab90`
  - **状态: 已回滚** (用户想先看新发现)
- [x] **回滚到基线**: `git reset --hard 9b6e07e9`, node_modules 重装
- [x] **HMR port 修复**: 干净工程 `pnpm build` 后报 `WebSocket connection to ws://localhost:3000/`
  - 根因: WXT 0.20.26 在生产 build 里残留 Vite HMR client, 默认连 3000
  - 修复: `wxt.config.ts` 加 `dev: { server: { port: 3030 } }`
  - commit: `d8c389af`
  - **注意**: 这是独立 bug,不影响 UTF-8 调试

## 关键文件 / 路径

| 路径 | 用途 |
|------|------|
| `agent-steer/` | 干净工程,基线 + bisect 实验场 |
| `agent-steer/wxt.config.ts` | WXT 配置 (含 HMR port 修复) |
| `agent-steer/entrypoints/content.ts` | 内容脚本 (基线: 只 `console.log`) |
| `agent-steer/.output/chrome-mv3/` | 生产 build 产物 (Chrome Load unpacked 用) |
| `chrome-extension/` | 坏工程,UTF-8 错误源 (未解) |
| `chrome-extension/.output/chrome-mv3/content-scripts/content.js` | 192KB, UTF-8 with CJK |
| `docs/agent-steer/utf8-bisect.md` | 详细 bisect 计划 (10 步) |

## UTF-8 嫌疑排名 (按可疑度)

| # | 嫌疑 | 证据 |
|---|------|------|
| 1 | **rrweb 自带的 CJK 字符** | 干净工程加 rrweb 后出现 18 个 CJK 字符,0xfffe 2 个,0xfeff 2 个 |
| 2 | **WXT IIFE wrapper** | `var content=(function()...)()` 包装 |
| 3 | **postcss 中文 deprecation** | 待确认 (干净工程未加 postcss 也能复现就排除) |
| 4 | **192KB 大文件启发式** | Chrome 未公开的大小检查 |
| 5 | **rrweb v2.0.0-alpha** | alpha 版可能有未知问题 |

## 当前基线状态

```
干净工程 (agent-steer/):
- WXT 0.20.26
- React 19
- 无 rrweb
- 无 Tailwindcss
- 无 postcss
- 无 IndexedDB / messaging / controller / 上传 / auth

Content script: 3.44KB, ASCII, 合法 UTF-8
Build 总大小: 213KB
Chrome 加载: ✓ 通过 (需要清缓存 + 显式 dev server port)
```

## 下一步: 继续 Bisect

**Step 2 (重做): 重新加 rrweb 到干净工程**

如果这次 Chrome Load unpacked 报 "not UTF-8 encoded":
- ✅ **嫌疑 1 锁定**: rrweb 自带的 CJK 字符 + BOM 字面量
- 修法: 换 rrweb 版本 (v1.x) 或 post-process 干掉 CJK 字符

如果通过 (Chrome 不报):
- 继续 Step 3: 加 Tailwindcss / postcss
- 进一步缩小嫌疑范围

## 测试 Chrome 加载的核弹流程

每次测试前都执行:

```bash
# 1. 完全退出 Chrome
osascript -e 'quit app "Google Chrome"'
pkill -9 "Google Chrome" 2>/dev/null
sleep 2

# 2. 删 Chrome 扩展缓存 (关键)
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Extensions
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Local\ Extension\ Settings

# 3. 确认 wxt 进程没跑 (避免 dev server 干扰)
pkill -9 -f "wxt" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
lsof -i:3030 2>&1 | head -2  # 应该空闲

# 4. 重新打开 Chrome → Load unpacked
#    选 /Volumes/data/working/ai/matrix/neo/agent-steer/.output/chrome-mv3
```

## 报告格式

每个 step 完成后:

1. **Pass 或 Fail**
2. 如果 Fail:**完整错误文本** (从 Chrome 对话框 copy)
3. 如果 Fail:`wc -c .output/chrome-mv3/content-scripts/content.js`
4. 如果 Fail:该 step 新增的依赖

## 数据收集 (每步记录)

- 文件大小
- 是否有 CJK 字符
- 是否有 `\ufeff` / `\ufffe` 字面量
- Load unpacked 结果
- commit hash
