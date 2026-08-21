#!/usr/bin/env bun
/**
 * Deletes Walter bulk institutions that the similarity report marks as name-high
 * (≥90% match to an existing approved row). Only rows with
 * source_url = 'walter-university-bulk-import' are removed; canonical candidates stay.
 *
 * Usage:
 *   bun scripts/delete-walter-high-name-duplicates.ts [--execute] [--report path/to.json]
 * Default report: scripts/data/walter-similarity-report.json
 *
 * Default is dry-run. Pass --execute to delete (after clearing claim_requests,
 * ramadhan_campaigns, and unlinking quest_mosques for those ids).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
	claimRequests,
	institutions,
	questMosques,
	ramadhanCampaigns,
} from "@/db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPORT = path.join(
	__dirname,
	"data",
	"walter-similarity-report.json",
);
const SOURCE_URL = "walter-university-bulk-import";

type HighRow = { walterId: number };

function parseArgs() {
	const argv = process.argv.slice(2);
	const execute = argv.includes("--execute");
	let reportPath = DEFAULT_REPORT;
	const ri = argv.indexOf("--report");
	if (ri !== -1 && argv[ri + 1]) reportPath = path.resolve(argv[ri + 1]);
	return { dryRun: !execute, reportPath };
}

async function main() {
	const { dryRun, reportPath } = parseArgs();

	if (!fs.existsSync(reportPath)) {
		console.error(`Report not found: ${reportPath}`);
		process.exit(1);
	}

	const raw = JSON.parse(fs.readFileSync(reportPath, "utf-8")) as {
		nameMatchesHigh?: HighRow[];
	};
	const requestedIds = [
		...new Set(
			(raw.nameMatchesHigh ?? [])
				.map((r) => r.walterId)
				.filter(Number.isFinite),
		),
	].sort((a, b) => a - b);

	if (requestedIds.length === 0) {
		console.log("No nameMatchesHigh entries in report; nothing to do.");
		return;
	}

	const rows = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			sourceUrl: institutions.sourceUrl,
		})
		.from(institutions)
		.where(inArray(institutions.id, requestedIds));

	const toDelete = rows.filter((r) => r.sourceUrl === SOURCE_URL);
	const skipped = rows.filter((r) => r.sourceUrl !== SOURCE_URL);
	const missing = requestedIds.filter((id) => !rows.some((r) => r.id === id));

	console.log("Walter name-high duplicate removal");
	console.log("===================================");
	console.log(`Report: ${reportPath}`);
	console.log(`Mode: ${dryRun ? "DRY-RUN (no DB changes)" : "EXECUTE"}`);
	console.log(`Requested from report: ${requestedIds.length} id(s)`);
	console.log(`Will delete (Walter source): ${toDelete.length}`);
	if (missing.length) console.log(`Missing in DB: ${missing.join(", ")}`);
	if (skipped.length) {
		console.log(
			`Skipped (not Walter source_url): ${skipped.map((r) => `${r.id} ${r.name}`).join("; ")}`,
		);
	}
	for (const r of toDelete) {
		console.log(`  - #${r.id} ${r.name}`);
	}

	if (toDelete.length === 0) return;

	const ids = toDelete.map((r) => r.id);

	if (dryRun) {
		console.log("\n[dry-run] No rows deleted.");
		return;
	}

	await db.transaction(async (tx) => {
		const cr = await tx
			.delete(claimRequests)
			.where(inArray(claimRequests.institutionId, ids))
			.returning({ id: claimRequests.id });
		if (cr.length) console.log(`Removed ${cr.length} claim_request(s).`);

		const rc = await tx
			.delete(ramadhanCampaigns)
			.where(inArray(ramadhanCampaigns.institutionId, ids))
			.returning({ id: ramadhanCampaigns.id });
		if (rc.length)
			console.log(`Removed ${rc.length} ramadhan_campaign row(s).`);

		await tx
			.update(questMosques)
			.set({ institutionId: null })
			.where(inArray(questMosques.institutionId, ids));

		const del = await tx
			.delete(institutions)
			.where(
				and(
					inArray(institutions.id, ids),
					eq(institutions.sourceUrl, SOURCE_URL),
				),
			)
			.returning({ id: institutions.id });
		console.log(`Deleted ${del.length} institution row(s).`);
	});

	console.log("Done.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
