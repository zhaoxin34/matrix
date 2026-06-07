import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	build: {
		outDir: "dist",
		emptyOutDir: true,
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
				assetFileNames: "assets/[name]-[hash][extname]",
			},
		},
	},
	resolve: {
		alias: {
			"@shared": resolve(__dirname, "src/shared"),
		},
	},
});
