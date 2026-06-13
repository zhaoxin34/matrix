#!/usr/bin/env node
/**
 * Post-build 脚本:剥掉 rrweb 注入到 content script 里的非 UTF-8 字符。
 *
 * Chrome 加载 extension 的 content_scripts 时,如果文件含特定高码点
 * 字符 (CJK、字面 BOM/Reverse-BOM) 会报:
 *   "Could not load file 'content-scripts/content.js'. It isn't UTF-8 encoded."
 *
 * 已知触发点 (postcss, rrweb 把 postcss 打了 2 份,文件里出现 2 次):
 * 1. 中文 deprecation warning: "里面 postcss.plugin 被弃用. 迁移指南: ..."
 *    - 只在 LANG=cn 时执行,替换成英文等价值完全安全
 * 2. 字面 BOM 字符: ﻿ ﻿ (U+FEFF) 和 ￾ ￾ (U+FFFE)
 *    - postcss CSS parser 用它们检测输入 CSS 的 BOM
 *    - 把字面字符换成 \u 转义序列,JS 运行时行为完全不变
 *
 * 触发后再写回文件,做幂等 (no-op 时不报错)。
 */
import fs from 'node:fs'
import path from 'node:path'

// chrome-extension 工程:rrweb 嵌在 content script 里
const FILE = '.output/chrome-mv3/content-scripts/content.js'

function countBadChars(text) {
  let cjk = 0, feff = 0, fffe = 0
  for (const ch of text) {
    const c = ch.codePointAt(0)
    if (c >= 0x4E00 && c <= 0x9FFF) cjk++
    if (c === 0xFEFF) feff++
    if (c === 0xFFFE) fffe++
  }
  return { cjk, feff, fffe }
}

const absFile = path.resolve(FILE)
if (!fs.existsSync(absFile)) {
  console.error(`[strip-rrweb] not found: ${absFile}`)
  process.exit(1)
}

const before = fs.readFileSync(absFile, 'utf8')
const beforeCount = countBadChars(before)
console.log('[strip-rrweb] before:', beforeCount)

if (beforeCount.cjk + beforeCount.feff + beforeCount.fffe === 0) {
  console.log('[strip-rrweb] no bad chars, no-op')
  process.exit(0)
}

// 1) 字面 BOM/Reverse-BOM → JS 转义序列 (源码 ASCII, 运行时等价)
let after = before
  .replace(/\uFEFF/g, '\\uFEFF')
  .replace(/\uFFFE/g, '\\uFFFE')

// 2) 中文 postcss deprecation warning → 英文
after = after.replace(
  /里面 postcss\.plugin 被弃用\. 迁移指南/g,
  'postcss.plugin is deprecated. Migration guide',
)

fs.writeFileSync(absFile, after, 'utf8')

const afterCount = countBadChars(after)
console.log('[strip-rrweb] after:', afterCount)
console.log('[strip-rrweb] diff:', {
  cjk: beforeCount.cjk - afterCount.cjk,
  feff: beforeCount.feff - afterCount.feff,
  fffe: beforeCount.fffe - afterCount.fffe,
})
