import { copyFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

// Files to copy to dist
const filesToCopy = [
  { src: "manifest.json", dest: "manifest.json" },
  { src: "public/popup.html", dest: "popup.html" },
  { src: "public/options.html", dest: "options.html" },
];

console.log("Copying assets to dist...");

for (const file of filesToCopy) {
  const src = join(rootDir, file.src);
  const dest = join(distDir, file.dest);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  Copied: ${file.src} -> ${file.dest}`);
  }
}

// Copy public directory (excluding HTML files)
const publicSrc = join(rootDir, "public");
const publicDest = join(distDir, "public");

if (existsSync(publicSrc)) {
  mkdirSync(publicDest, { recursive: true });
  for (const file of readdirSync(publicSrc)) {
    if (!file.endsWith(".html")) {
      copyFileSync(join(publicSrc, file), join(publicDest, file));
      console.log(`  Copied: public/${file}`);
    }
  }
}

console.log("Assets copied successfully!");
