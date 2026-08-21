#!/usr/bin/env bun

import fs from "node:fs";
import path from "node:path";
import {
	buildRamadhanWrappedMarkdown,
	getRamadhanWrappedStats,
	RAMADHAN_WRAPPED_CONFIG,
} from "@/lib/ramadhan-wrapped";

function resolveOutDir(argv: string[]): string {
	const outDirFlag = argv.find((arg) => arg.startsWith("--outDir="));
	if (outDirFlag) {
		return path.resolve(outDirFlag.replace("--outDir=", ""));
	}

	const idx = argv.indexOf("--outDir");
	if (idx !== -1 && argv[idx + 1]) {
		return path.resolve(argv[idx + 1]);
	}

	return path.resolve(process.cwd(), "reports");
}

async function main() {
	const outDir = resolveOutDir(process.argv.slice(2));
	const stats = await getRamadhanWrappedStats();
	const markdown = buildRamadhanWrappedMarkdown(stats);

	fs.mkdirSync(outDir, { recursive: true });

	const dateLabel = `${RAMADHAN_WRAPPED_CONFIG.startDate}_to_${RAMADHAN_WRAPPED_CONFIG.endDate}`;
	const jsonPath = path.join(
		outDir,
		`ramadhan-wrapped-${RAMADHAN_WRAPPED_CONFIG.year}-${dateLabel}.json`,
	);
	const mdPath = path.join(
		outDir,
		`ramadhan-wrapped-${RAMADHAN_WRAPPED_CONFIG.year}-${dateLabel}.md`,
	);

	fs.writeFileSync(jsonPath, `${JSON.stringify(stats, null, 2)}\n`, "utf-8");
	fs.writeFileSync(mdPath, markdown, "utf-8");

	console.log("Ramadhan Wrapped report generated.");
	console.log(`JSON: ${jsonPath}`);
	console.log(`MD:   ${mdPath}`);
	process.exit(0);
}

main().catch((error) => {
	console.error("Failed to generate Ramadhan Wrapped report:", error);
	process.exit(1);
});
