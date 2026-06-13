/**
 * Reproduce the Chrome extension load error in a real (headless) Chrome.
 *
 * Launches Chromium with --load-extension pointing at our build output,
 * captures the exact error Chrome produces during extension validation,
 * and reports whether the bug reproduces in a clean Chrome environment
 * (which would rule out cache issues specific to the user's profile).
 *
 * Run: node scripts/repro-extension-load.mjs
 */

import { chromium } from "playwright";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { rm, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const extDir = resolve(__dirname, "..", ".output", "chrome-mv3");

async function main() {
  console.log("Extension dir:", extDir);
  console.log("Contents:", (await readdir(extDir)).filter((f) => !f.startsWith(".")));

  // Fresh user data dir to rule out any cache.
  const userDataDir = path.join(os.tmpdir(), `playwright-agent-steer-${Date.now()}`);
  console.log("User data dir:", userDataDir);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true, // headless: false was timing out
    args: [
      `--disable-extensions-except=${extDir}`,
      `--load-extension=${extDir}`,
      "--no-sandbox",
    ],
  });

  // Wait for the extension to be loaded.
  await new Promise((r) => setTimeout(r, 3000));

  // Check service workers (extension's background)
  const workers = context.serviceWorkers();
  console.log(`\nService workers: ${workers.length}`);
  for (const w of workers) console.log(`  ${w.url()}`);

  // Open chrome://extensions/ in a regular tab to see what Chrome reports
  const page = await context.newPage();
  const consoleMsgs = [];
  const pageErrors = [];
  page.on("console", (m) => consoleMsgs.push(`[${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => pageErrors.push(`${e.name}: ${e.message}`));

  try {
    await page.goto("chrome://extensions/", { waitUntil: "domcontentloaded", timeout: 10000 });
    await page.waitForTimeout(2000);
    const extensions = await page.evaluate(() => {
      const manager = document.querySelector("extensions-manager");
      if (!manager) return "(no extensions-manager)";
      const items = manager.shadowRoot?.querySelectorAll("extensions-item") ?? [];
      return Array.from(items).map((it) => {
        return it.shadowRoot
          ? {
              name: it.shadowRoot.querySelector("#name")?.textContent ?? "?",
              errors: it.shadowRoot.querySelector(".error-text")?.textContent ?? "(no error)",
            }
          : { name: "?", errors: "(no shadow root)" };
      });
    });
    console.log("\nExtensions registered:");
    for (const e of extensions) console.log(`  ${e.name}: ${e.errors}`);
  } catch (err) {
    console.log("Could not open chrome://extensions:", err.message);
  }

  console.log("\nConsole messages:");
  for (const m of consoleMsgs) console.log(`  ${m}`);

  console.log("\nPage errors:");
  for (const e of pageErrors) console.log(`  ${e}`);

  await page.screenshot({ path: "scripts/repro-chrome.png", fullPage: true });
  console.log("\n📸 Screenshot: scripts/repro-chrome.png");

  await context.close();
  await rm(userDataDir, { recursive: true, force: true });

  if (workers.length === 0) {
    console.log("\n❌ Extension failed to load (no service workers)");
    process.exit(1);
  } else {
    console.log("\n✓ Extension loaded successfully in headless Chrome");
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(2);
});
