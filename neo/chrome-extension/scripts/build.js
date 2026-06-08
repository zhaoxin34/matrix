/**
 * Build script using esbuild
 * Bundles each entry point as IIFE for Chrome Extension compatibility
 */

import * as esbuild from "esbuild";
import {
	existsSync,
	mkdirSync,
	copyFileSync,
	readdirSync,
	writeFileSync,
} from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const distDir = join(rootDir, "dist");

// Ensure dist directory exists
if (!existsSync(distDir)) {
	mkdirSync(distDir, { recursive: true });
}

// Entry points configuration
const entries = [
	{
		name: "content",
		entry: join(rootDir, "src/content/index.ts"),
		outfile: join(distDir, "content.js"),
	},
	{
		name: "background",
		entry: join(rootDir, "src/background/index.ts"),
		outfile: join(distDir, "background.js"),
	},
	{
		name: "popup",
		entry: join(rootDir, "src/extension/popup.ts"),
		outfile: join(distDir, "popup.js"),
	},
	{
		name: "options",
		entry: join(rootDir, "src/extension/options.ts"),
		outfile: join(distDir, "options.js"),
	},
];

// Shared esbuild options
const sharedOptions = {
	bundle: true,
	minify: false,
	sourcemap: false,
	target: ["chrome120"],
	format: "iife",
	platform: "browser",
	logLevel: "info",
	alias: {
		"@shared": join(rootDir, "src/shared"),
	},
};

// Build all entries
async function build() {
	console.log("Building Chrome Extension with esbuild...\n");

	// Build each entry
	const results = await Promise.all(
		entries.map(async (entry) => {
			try {
				const result = await esbuild.build({
					...sharedOptions,
					entryPoints: [entry.entry],
					outfile: entry.outfile,
				});
				console.log(`✓ Built: ${entry.name}.js`);
				return { success: true, name: entry.name };
			} catch (error) {
				console.error(`✗ Failed: ${entry.name}.js -`, error.message);
				return { success: false, name: entry.name, error };
			}
		}),
	);

	// Check results
	const failed = results.filter((r) => !r.success);
	if (failed.length > 0) {
		console.error(`\n✗ Build failed for ${failed.length} entry(ies)`);
		process.exit(1);
	}

	console.log("\n✓ All entries built successfully!");
	console.log("Copying assets...\n");

	// Copy manifest
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
		action: {
			default_popup: "popup.html",
			default_icon: {
				16: "icon-16.png",
				48: "icon-48.png",
				128: "icon-128.png",
			},
		},
		icons: {
			16: "icon-16.png",
			48: "icon-48.png",
			128: "icon-128.png",
		},
	};

	writeFileSync(
		join(distDir, "manifest.json"),
		JSON.stringify(manifest, null, 2),
	);
	console.log("  Copied: manifest.json");

	// Copy public assets
	const publicDir = join(rootDir, "public");
	if (existsSync(publicDir)) {
		for (const file of readdirSync(publicDir)) {
			if (!file.endsWith(".html")) {
				copyFileSync(join(publicDir, file), join(distDir, file));
				console.log(`  Copied: ${file}`);
			}
		}
		copyFileSync(join(publicDir, "popup.html"), join(distDir, "popup.html"));
		copyFileSync(
			join(publicDir, "options.html"),
			join(distDir, "options.html"),
		);
		console.log("  Copied: popup.html, options.html");
	}

	console.log("\n✓ Build complete!");
}

build().catch((error) => {
	console.error("Build failed:", error);
	process.exit(1);
});
