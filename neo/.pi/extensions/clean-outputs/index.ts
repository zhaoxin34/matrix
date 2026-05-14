import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Clean outputs extension - removes .pi/outputs/*.md files on session start
 */
export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (event, ctx) => {
		const cwd = event.cwd || process.cwd();
		const outputsDir = path.join(cwd, ".pi", "outputs");

		// Check if outputs directory exists
		if (!fs.existsSync(outputsDir)) {
			return;
		}

		// Get all files in outputs directory
		const files = fs.readdirSync(outputsDir);

		// Filter for .md and .png files
		const toDelete = files.filter(
			(f) => f.endsWith(".md") || f.endsWith(".png"),
		);

		if (toDelete.length === 0) {
			return;
		}

		// Delete files
		let deletedCount = 0;
		for (const file of toDelete) {
			const filePath = path.join(outputsDir, file);
			try {
				fs.unlinkSync(filePath);
				deletedCount++;
			} catch (err) {
				// Ignore errors, file might not exist or be locked
				console.error(`Failed to delete ${filePath}:`, err);
			}
		}

		// Optionally notify (can be disabled if too noisy)
		// ctx.ui.notify(`Cleaned ${deletedCount} output files`, "info");
	});
}
