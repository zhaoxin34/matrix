/**
 * Test a minimal extension (just manifest + tiny background) to see
 * whether Playwright headless Chrome can load ANY extension at all
 * in this environment. Used to isolate whether the bug is in our
 * build output or in the test harness.
 */

import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";
import { rm, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpExtDir = path.join(os.tmpdir(), "minimal-test-ext");

await mkdir(tmpExtDir, { recursive: true });
await writeFile(
  path.join(tmpExtDir, "manifest.json"),
  JSON.stringify({
    manifest_version: 3,
    name: "minimal-test",
    version: "0.1.0",
    background: { service_worker: "bg.js" },
  }),
);
await writeFile(path.join(tmpExtDir, "bg.js"), 'console.log("hi from bg");');

const userDataDir = path.join(os.tmpdir(), `pw-minimal-${Date.now()}`);
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  args: [
    `--disable-extensions-except=${tmpExtDir}`,
    `--load-extension=${tmpExtDir}`,
    "--no-sandbox",
  ],
});

for (let i = 0; i < 20; i++) {
  await new Promise((r) => setTimeout(r, 500));
  if (context.serviceWorkers().length > 0) break;
}

const sws = context.serviceWorkers();
console.log("Service workers after 10s wait:", sws.length);
for (const w of sws) console.log("  ", w.url());

await context.close();
await rm(userDataDir, { recursive: true, force: true });
await rm(tmpExtDir, { recursive: true, force: true });

process.exit(sws.length > 0 ? 0 : 1);
