import { defineConfig } from "vite";
import { resolve } from "path";
import {
	writeFileSync,
	mkdirSync,
	existsSync,
	readdirSync,
	copyFileSync,
	readFileSync,
} from "fs";
import { join } from "path";

const rootDir = resolve(__dirname);
const distDir = join(rootDir, "dist");

export default defineConfig({
	build: {
		outDir: "dist",
		emptyOutDir: true,
		sourcemap: false,
		rollupOptions: {
			input: {
				background: resolve(__dirname, "src/background/index.ts"),
				content: resolve(__dirname, "src/content/index.ts"),
				popup: resolve(__dirname, "src/extension/popup.ts"),
				options: resolve(__dirname, "src/extension/options.ts"),
			},
			output: {
				entryFileNames: "[name].js",
				chunkFileNames: "chunks/[name]-[hash].js",
				assetFileNames: "assets/[name-[hash][extname]",
			},
		},
	},
	resolve: {
		alias: {
			"@shared": resolve(__dirname, "src/shared"),
		},
	},
});

// Fix content.js to be valid IIFE by wrapping
function fixContentScript() {
	const contentPath = join(distDir, "content.js");
	if (!existsSync(contentPath)) return;

	let content = readFileSync(contentPath, "utf-8");

	// Remove any BOM
	if (content.charCodeAt(0) === 0xfeff) {
		content = content.slice(1);
	}

	// If it's ES module, wrap it
	if (content.includes("import(") || content.startsWith("import ")) {
		// Wrap as IIFE with import polyfill
		const wrapped = `(function() {
  // Polyfill for dynamic import in content scripts
  function importScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Execute the module code
  ${content.replace(/^import\s+.*?from\s+['"](.+?)['"];?\n?/gm, "").replace(/export\s*\{[^}]*\}\s*;?/g, "")}
})();`;

		writeFileSync(contentPath, wrapped, "utf-8");
	}
}

// Copy manifest and assets
function copyAssets() {
	if (!existsSync(distDir)) {
		mkdirSync(distDir, { recursive: true });
	}

	const manifest = {
		manifest_version: 3,
		name: "Neo Agent",
		version: "0.1.0",
		description: "AI Agent Chrome Extension",
		permissions: ["storage", "activeTab", "scripting", "tabs"],
		host_permissions: ["<all_urls>"],
		background: {
			service_worker: "background.js",
			type: "module",
		},
		content_scripts: [
			{
				matches: ["<all_urls>"],
				js: ["content.js"],
				run_at: "document_start",
			},
		],
		web_accessible_resources: [
			{
				resources: ["content.js", "chunks/*"],
				matches: ["<all_urls>"],
			},
		],
		action: {
			default_popup: "popup.html",
			default_icon: {
				"16": "icon-16.png",
				"48": "icon-48.png",
				"128": "icon-128.png",
			},
		},
		icons: {
			"16": "icon-16.png",
			"48": "icon-48.png",
			"128": "icon-128.png",
		},
	};

	writeFileSync(
		join(distDir, "manifest.json"),
		JSON.stringify(manifest, null, 2),
	);

	const publicDir = join(rootDir, "public");
	if (existsSync(publicDir)) {
		for (const file of readdirSync(publicDir)) {
			if (!file.endsWith(".html")) {
				copyFileSync(join(publicDir, file), join(distDir, file));
			}
		}
	}

	copyFileSync(join(publicDir, "popup.html"), join(distDir, "popup.html"));
	copyFileSync(join(publicDir, "options.html"), join(distDir, "options.html"));

	// Fix content script
	fixContentScript();

	console.log("Assets copied successfully!");
}

copyAssets();
