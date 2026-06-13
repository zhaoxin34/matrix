import { defineConfig } from 'wxt'

/**
 * Vite plugin: 剥掉 rrweb 依赖链里 postcss 自带的 UTF-8 拒字符。
 *
 * Chrome 加载 extension js (content script 或 executeScript files) 会拒
 * 含特定高码点字符 (CJK、字面 BOM/Reverse-BOM) 的文件,报
 *   "Could not load file '...'. It isn't UTF-8 encoded."
 *
 * 已知触发点 (来自 postcss, rrweb 把它打了 2 份):
 * 1. 中文 deprecation warning: "里面 postcss.plugin 被弃用. 迁移指南: ..."
 *    - 只在 LANG=cn 时执行,替换成英文等价值完全安全
 * 2. 字面 BOM 字符: ﻿ (U+FEFF) 和 ￾ (U+FFFE)
 *    - postcss CSS parser 用它们检测输入 CSS 的 BOM
 *    - 必须处理两种形式:源文件里可能是 escape sequence `\uFEFF`
 *      (6 个 ASCII 字符),也可能是字面 U+FEFF 字符
 *    - 都转成 `String.fromCharCode(0xFEFF)` (纯 ASCII 函数调用,
 *      运行时等价,esbuild 不会再转回字面字符)
 *
 * 为什么用 Vite plugin 而不是只在 post-build 脚本:
 * - post-build 脚本不跑 dev (dev 是长进程,不落盘后处理)
 * - Vite transform 钩子在 dev 和 build 两种模式都执行
 * - 一处实现,dev + prod 通用
 *
 * Post-build 脚本 (scripts/strip-rrweb-utf8-bad-chars.mjs) 保留作为兜底。
 */
function stripRrwebUtf8BadChars() {
  return {
    name: 'strip-rrweb-utf8-bad-chars',
    enforce: 'post' as const,
    transform(code: string) {
      // fast no-op 路径:大多数文件没这些字符
      if (
        !code.includes('里面') &&
        !code.includes('\uFEFF') &&
        !code.includes('\uFFFE') &&
        !code.includes('\\uFEFF') &&
        !code.includes('\\uFFFE')
      ) {
        return null
      }
      return code
        // 字面 U+FEFF/U+FFFE 字符 → ASCII 表达式
        .replace(/\uFEFF/g, 'String.fromCharCode(0xFEFF)')
        .replace(/\uFFFE/g, 'String.fromCharCode(0xFFFE)')
        // escape sequence 形式 (6 个 ASCII 字符: \ u F E F F) → ASCII 表达式
        // 用 String.fromCharCode 而非 \uFEFF 是因为后者会被 esbuild
        // 还原成字面字符,前者是函数调用不会
        .replace(/\\uFEFF/g, 'String.fromCharCode(0xFEFF)')
        .replace(/\\uFFFE/g, 'String.fromCharCode(0xFFFE)')
        // postcss 中文 deprecation warning → 英文
        .replace(
          /里面 postcss\.plugin 被弃用\. 迁移指南/g,
          'postcss.plugin is deprecated. Migration guide',
        )
    },
  }
}

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  // 明确设置源码目录（根目录）
  srcDir: '.',

  // 入口点目录
  entrypointsDir: 'entrypoints',
  dev: {
    server: {
      port: 3030,
    },
  },

  // CRITICAL for Chrome extensions: Vite defaults to absolute paths
  // (e.g. /chunks/popup.js) which don't resolve under
  // chrome-extension://[id]/. We must use relative paths so the popup
  // HTML can locate its JS and CSS bundles at runtime.
  //
  // sourcemap: false disables inline source maps; some users have
  // reported that Chrome occasionally mis-reports valid UTF-8 content
  // scripts as "not UTF-8 encoded" when the bundle contains inline
  // source maps, so we play it safe.
  vite: () => ({
    base: '',
    build: {
      sourcemap: false,
    },
    plugins: [stripRrwebUtf8BadChars()],
  }),

  manifest: {
    // 用于 popup 中嵌入 iframe 拉取 user info（见 src/auth/iframe-bridge.ts）
    // 本地开发覆盖最常见端口；生产域名通过运行时配置（api_base_url / frontend_base_url）扩展
    host_permissions: ['http://localhost:3000/*', 'http://127.0.0.1:3000/*'],
  },
})
