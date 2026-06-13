/**
 * Post-build path fixer.
 *
 * WXT 0.20.x emits popup.html with `../../chunks/...` paths but the
 * chunks/ folder is actually at the same level as popup.html. This
 * script rewrites the paths to be correctly relative.
 *
 * Run via: `node scripts/fix-paths.js`
 * Or wired into package.json as a postbuild step.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", ".output", "chrome-mv3");

const htmlPath = join(outDir, "popup.html");
try {
  let html = await readFile(htmlPath, "utf8");
  // Replace ../../chunks/ and ../../assets/ with ./chunks/ and ./assets/
  const before = html;
  html = html.replace(/\.\.\/\.\.\/chunks\//g, "./chunks/");
  html = html.replace(/\.\.\/\.\.\/assets\//g, "./assets/");
  // Also handle the case where the path has ../../ (single parent) just in case
  html = html.replace(/(?<![\.\/])\.\.\/chunks\//g, "./chunks/");
  html = html.replace(/(?<![\.\/])\.\.\/assets\//g, "./assets/");
  if (html !== before) {
    await writeFile(htmlPath, html, "utf8");
    console.log("✓ Fixed paths in popup.html");
  } else {
    console.log("• No path fix needed");
  }
} catch (err) {
  console.error("Could not fix popup.html paths:", err);
  process.exit(1);
}
