/**
 * After Walter bulk import: remove DB rows + duplicate files, leave only images
 * that need manual review (no-QR + report errors) under to-review/.
 *
 * Usage: bun scripts/cleanup-walter-bulk.ts [--dry-run]
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { env } from "../env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dirname, "data", "walter-university-qrs");
const REPORT_PATH = path.join(__dirname, "data", "walter-import-report.json");
const SOURCE_URL = "walter-university-bulk-import";

const TO_REVIEW = path.join(BASE, "to-review");
const ARCHIVE = path.join(BASE, "_archive");
const QUARANTINE = path.join(BASE, "_quarantine");
const NO_QR_SRC = path.join(QUARANTINE, "no-qr");
const DUP_SRC = path.join(QUARANTINE, "duplicate");

function isImage(name: string): boolean {
	const l = name.toLowerCase();
	return (
		(l.endsWith(".jpeg") || l.endsWith(".jpg") || l.endsWith(".png")) &&
		!name.startsWith(".")
	);
}

function ensureDir(p: string) {
	fs.mkdirSync(p, { recursive: true });
}

function moveFile(src: string, destDir: string, dryRun: boolean): boolean {
	if (!fs.existsSync(src)) return false;
	ensureDir(destDir);
	const base = path.basename(src);
	let dest = path.join(destDir, base);
	if (fs.existsSync(dest)) {
		const stem = path.parse(base).name;
		const ext = path.parse(base).ext;
		let n = 1;
		while (fs.existsSync(dest)) {
			dest = path.join(destDir, `${stem}__${n}${ext}`);
			n++;
		}
	}
	if (dryRun) {
		console.log(`  [dry-run] mv ${src} -> ${dest}`);
		return true;
	}
	fs.renameSync(src, dest);
	return true;
}

function removePath(p: string, dryRun: boolean) {
	if (!fs.existsSync(p)) return;
	if (dryRun) {
		console.log(`  [dry-run] rm -rf ${p}`);
		return;
	}
	fs.rmSync(p, { recursive: true, force: true });
}

async function main() {
	const dryRun = process.argv.includes("--dry-run");
	const pool = new Pool({ connectionString: env.DATABASE_URL });

	console.log("Walter bulk cleanup");
	console.log("===================");
	console.log(`Dry run: ${dryRun}\n`);

	const countResult = await pool.query(
		`SELECT COUNT(*)::int AS c FROM institutions WHERE source_url = $1`,
		[SOURCE_URL],
	);
	const n = countResult.rows[0]?.c ?? 0;
	console.log(`DB rows with source_url=${SOURCE_URL}: ${n}`);

	if (!dryRun && n > 0) {
		const del = await pool.query(
			`DELETE FROM institutions WHERE source_url = $1`,
			[SOURCE_URL],
		);
		console.log(`Deleted ${del.rowCount ?? 0} institution row(s).`);
	} else if (dryRun && n > 0) {
		console.log(`[dry-run] Would delete ${n} institution row(s).`);
	}

	let report: {
		entries: Array<{ file: string; status: string; detail?: string }>;
	} | null = null;
	if (fs.existsSync(REPORT_PATH)) {
		try {
			report = JSON.parse(
				fs.readFileSync(REPORT_PATH, "utf-8"),
			) as typeof report;
		} catch {
			console.warn("Could not parse report JSON.");
		}
	}

	ensureDir(TO_REVIEW);
	ensureDir(path.join(TO_REVIEW, "no-qr"));
	ensureDir(path.join(TO_REVIEW, "failed-from-report"));
	ensureDir(path.join(ARCHIVE, "imported-via-script"));
	ensureDir(path.join(ARCHIVE, "skipped-duplicate-qr"));

	console.log("\nFilesystem:");
	console.log("--- no-QR → to-review/no-qr/");
	if (fs.existsSync(NO_QR_SRC)) {
		for (const name of fs.readdirSync(NO_QR_SRC)) {
			if (!isImage(name)) continue;
			const src = path.join(NO_QR_SRC, name);
			moveFile(src, path.join(TO_REVIEW, "no-qr"), dryRun);
		}
	}

	console.log("--- Remove duplicate quarantine (same QR already in DB)");
	removePath(DUP_SRC, dryRun);

	console.log("--- Report: inserted → _archive/imported-via-script/");
	console.log(
		"--- Report: skipped duplicate_qr → _archive/skipped-duplicate-qr/",
	);
	console.log("--- Report: errors → to-review/failed-from-report/");

	const rootFiles = fs.existsSync(BASE)
		? fs.readdirSync(BASE).filter(isImage)
		: [];
	const rootSet = new Set(rootFiles);

	if (report?.entries) {
		for (const e of report.entries) {
			if (!isImage(e.file)) continue;
			const src = path.join(BASE, e.file);
			if (!fs.existsSync(src) && !dryRun) continue;
			if (e.status === "inserted") {
				moveFile(src, path.join(ARCHIVE, "imported-via-script"), dryRun);
				rootSet.delete(e.file);
			} else if (e.status === "skipped" && e.detail === "duplicate_qr_in_db") {
				moveFile(src, path.join(ARCHIVE, "skipped-duplicate-qr"), dryRun);
				rootSet.delete(e.file);
			} else if (e.status === "error") {
				moveFile(src, path.join(TO_REVIEW, "failed-from-report"), dryRun);
				rootSet.delete(e.file);
			}
		}
	}

	console.log("--- Remaining root images → _archive/unmatched-root/");
	for (const name of rootSet) {
		const src = path.join(BASE, name);
		if (fs.existsSync(src)) {
			ensureDir(path.join(ARCHIVE, "unmatched-root"));
			moveFile(src, path.join(ARCHIVE, "unmatched-root"), dryRun);
		}
	}

	console.log("--- Remove empty _quarantine tree");
	if (!dryRun && fs.existsSync(QUARANTINE)) {
		try {
			fs.rmSync(QUARANTINE, { recursive: true, force: true });
		} catch (err) {
			console.warn("Could not remove _quarantine:", err);
		}
	} else if (dryRun) {
		console.log("  [dry-run] rm -rf _quarantine");
	}

	console.log("\nDone. Filter images under:");
	console.log(`  ${path.join(TO_REVIEW, "no-qr")}`);
	console.log(`  ${path.join(TO_REVIEW, "failed-from-report")}`);

	await pool.end();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
