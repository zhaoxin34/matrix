// Pure JS test of comment-color module (compiled from TS at runtime)
import { COMMENT_COLOR_PALETTE, getCreatorColor } from "../comment-color.ts";

const checks = [];
function assert(name, cond, detail = "") { checks.push({ name, cond, detail }); }

assert("palette has 8 colors", COMMENT_COLOR_PALETTE.length === 8);
const id1a = getCreatorColor(1);
const id1b = getCreatorColor(1);
assert("same id → same color", id1a === id1b);
const samples = Array.from({ length: 10 }, (_, i) => getCreatorColor(i + 1));
const unique = new Set(samples).size;
assert("10 small ids yield at least 8 unique colors", unique >= 8);
const all = Array.from({ length: 1000 }, (_, i) => getCreatorColor(i + 1));
const allInPalette = all.every((c) => COMMENT_COLOR_PALETTE.includes(c));
assert("1000 ids all map to palette", allInPalette);
const counts = new Map();
for (const c of all) counts.set(c, (counts.get(c) ?? 0) + 1);
const maxShare = Math.max(...counts.values()) / 1000;
assert("no color > 25% over 1000 ids", maxShare <= 0.25);

let failed = 0;
for (const c of checks) { if (!c.cond) failed++; console.log(`${c.cond ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`); }
if (failed > 0) { console.error(`${failed} of ${checks.length} FAILED`); process.exit(1); }
console.log(`${checks.length}/${checks.length} PASSED`);
