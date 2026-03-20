#!/usr/bin/env bun
/**
 * Similarity audit: Walter bulk-import rows vs existing institutions.
 * Phase 1 — same qr_content as any other row (critical).
 * Phase 2 — fuzzy name match (same logic as match-quest-mosques).
 *
 * READ-ONLY — no database writes.
 *
 * Usage:
 *   bun scripts/match-walter-institutions.ts
 *   bun scripts/match-walter-institutions.ts --include-pending-existing
 *   bun scripts/match-walter-institutions.ts --min-similarity 0.75
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { and, eq, isNotNull, notInArray, or } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { findBestNameMatch } from "./_lib/institution-name-similarity";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(
	__dirname,
	"data",
	"walter-similarity-report.json",
);
const SOURCE_URL = "walter-university-bulk-import";

type QrRow = {
	id: number;
	qrContent: string;
	name: string;
	status: string;
	slug: string;
	sourceUrl: string | null;
};

function parseArgs(argv: string[]) {
	let includePendingExisting = false;
	let minSimilarity = 0.7;

	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--include-pending-existing") includePendingExisting = true;
		else if (a === "--min-similarity" && argv[i + 1]) {
			minSimilarity = Number.parseFloat(argv[i + 1]);
			i++;
		}
	}

	if (
		!Number.isFinite(minSimilarity) ||
		minSimilarity < 0 ||
		minSimilarity > 1
	) {
		throw new Error("--min-similarity must be between 0 and 1");
	}

	return { includePendingExisting, minSimilarity };
}

type Candidate = {
	id: number;
	name: string;
	city: string;
	state: string;
	category: string;
	status: string;
	slug: string;
};

async function main() {
	const { includePendingExisting, minSimilarity } = parseArgs(
		process.argv.slice(2),
	);

	console.log("Walter bulk import — similarity audit");
	console.log("=======================================");
	console.log(`includePendingExisting: ${includePendingExisting}`);
	console.log(`minLevenshteinSimilarity: ${minSimilarity}\n`);

	const walterRows = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			city: institutions.city,
			state: institutions.state,
			category: institutions.category,
			status: institutions.status,
			slug: institutions.slug,
			sourceUrl: institutions.sourceUrl,
			qrContent: institutions.qrContent,
		})
		.from(institutions)
		.where(eq(institutions.sourceUrl, SOURCE_URL))
		.orderBy(institutions.id);

	console.log(`Walter bulk rows: ${walterRows.length}\n`);
	if (walterRows.length === 0) {
		console.log("Nothing to compare. Exiting.");
		return;
	}

	const walterIds = walterRows.map((r) => r.id);

	// --- Phase 1: qr_content duplicates ---
	const qrRows = await db
		.select({
			id: institutions.id,
			qrContent: institutions.qrContent,
			name: institutions.name,
			status: institutions.status,
			slug: institutions.slug,
			sourceUrl: institutions.sourceUrl,
		})
		.from(institutions)
		.where(isNotNull(institutions.qrContent));

	const byQr = new Map<string, QrRow[]>();
	for (const row of qrRows) {
		const qc = row.qrContent?.trim();
		if (!qc) continue;
		const arr = byQr.get(qc) ?? [];
		arr.push({
			id: row.id,
			qrContent: qc,
			name: row.name,
			status: row.status,
			slug: row.slug,
			sourceUrl: row.sourceUrl,
		});
		byQr.set(qc, arr);
	}

	const qrDuplicates: Array<{
		walterId: number;
		walterName: string;
		qrPrefix: string;
		otherInstitutions: Array<{
			id: number;
			name: string;
			status: string;
			slug: string;
			sourceUrl: string | null;
		}>;
	}> = [];

	for (const w of walterRows) {
		const q = w.qrContent?.trim();
		if (!q) continue;
		const group = byQr.get(q) ?? [];
		const others = group.filter((r) => r.id !== w.id);
		if (others.length === 0) continue;
		qrDuplicates.push({
			walterId: w.id,
			walterName: w.name,
			qrPrefix: q.length > 48 ? `${q.slice(0, 48)}…` : q,
			otherInstitutions: others.map((o) => ({
				id: o.id,
				name: o.name,
				status: o.status,
				slug: o.slug,
				sourceUrl: o.sourceUrl,
			})),
		});
	}

	// --- Phase 2: name fuzzy ---
	let candidates: Candidate[];

	if (includePendingExisting) {
		candidates = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				city: institutions.city,
				state: institutions.state,
				category: institutions.category,
				status: institutions.status,
				slug: institutions.slug,
			})
			.from(institutions)
			.where(
				or(
					eq(institutions.status, "approved"),
					and(
						eq(institutions.status, "pending"),
						notInArray(institutions.id, walterIds),
					),
				),
			)
			.orderBy(institutions.name);
	} else {
		candidates = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				city: institutions.city,
				state: institutions.state,
				category: institutions.category,
				status: institutions.status,
				slug: institutions.slug,
			})
			.from(institutions)
			.where(eq(institutions.status, "approved"))
			.orderBy(institutions.name);
	}

	console.log(`Name-match candidates: ${candidates.length}\n`);

	const highName: Array<{
		walterId: number;
		walterName: string;
		similarity: number;
		matchType: string;
		candidateId: number;
		candidateName: string;
		candidateCity: string;
		candidateState: string;
		candidateCategory: string;
		candidateStatus: string;
		normWalter: string;
		normCandidate: string;
	}> = [];

	const mediumName: Array<(typeof highName)[number]> = [];
	const noNameMatch: Array<{ walterId: number; walterName: string }> = [];

	for (const w of walterRows) {
		const best = findBestNameMatch(w.name, candidates, {
			minLevenshteinSimilarity: minSimilarity,
		});

		if (!best) {
			noNameMatch.push({ walterId: w.id, walterName: w.name });
			continue;
		}

		const row = {
			walterId: w.id,
			walterName: w.name,
			similarity: best.similarity,
			matchType: best.matchType,
			candidateId: best.item.id,
			candidateName: best.item.name,
			candidateCity: best.item.city,
			candidateState: best.item.state,
			candidateCategory: best.item.category,
			candidateStatus: best.item.status,
			normWalter: best.normSource,
			normCandidate: best.normTarget,
		};

		if (best.similarity >= 0.9) {
			highName.push(row);
		} else {
			mediumName.push(row);
		}
	}

	highName.sort((a, b) => b.similarity - a.similarity);
	mediumName.sort((a, b) => b.similarity - a.similarity);

	// --- Console ---
	console.log("=".repeat(100));
	console.log(
		`QR_CONTENT DUPLICATE — ${qrDuplicates.length} Walter row(s) share qr_content with another institution`,
	);
	console.log("=".repeat(100));
	for (const d of qrDuplicates) {
		console.log(`\n  Walter #${d.walterId}: ${d.walterName}`);
		console.log(`  QR prefix: ${d.qrPrefix}`);
		for (const o of d.otherInstitutions) {
			console.log(
				`    → #${o.id} ${o.name} [${o.status}] slug=${o.slug}${o.sourceUrl ? ` source=${o.sourceUrl}` : ""}`,
			);
		}
	}

	console.log(`\n${"=".repeat(100)}`);
	console.log(
		`NAME HIGH (>=90%) — ${highName.length} — likely same place / needs admin decision`,
	);
	console.log("=".repeat(100));
	for (const m of highName) {
		console.log(
			`\n  [${(m.similarity * 100).toFixed(1)}%] ${m.matchType.toUpperCase()}`,
		);
		console.log(`  Walter #${m.walterId}: ${m.walterName}`);
		console.log(
			`  Candidate #${m.candidateId}: ${m.candidateName} (${m.candidateCity}, ${m.candidateState}) [${m.candidateCategory}] ${m.candidateStatus}`,
		);
		console.log(`  Normalized: "${m.normWalter}" ↔ "${m.normCandidate}"`);
	}

	console.log(`\n${"=".repeat(100)}`);
	console.log(
		`NAME MEDIUM (${(minSimilarity * 100).toFixed(0)}-89%) — ${mediumName.length} — human review`,
	);
	console.log("=".repeat(100));
	for (const m of mediumName) {
		console.log(
			`\n  [${(m.similarity * 100).toFixed(1)}%] ${m.matchType.toUpperCase()}`,
		);
		console.log(`  Walter #${m.walterId}: ${m.walterName}`);
		console.log(
			`  Candidate #${m.candidateId}: ${m.candidateName} (${m.candidateCity}, ${m.candidateState}) [${m.candidateCategory}] ${m.candidateStatus}`,
		);
		console.log(`  Normalized: "${m.normWalter}" ↔ "${m.normCandidate}"`);
	}

	console.log(`\n${"=".repeat(100)}`);
	console.log(
		`NO NAME MATCH (>=${minSimilarity} fuzzy) — ${noNameMatch.length}`,
	);
	console.log("=".repeat(100));
	for (const n of noNameMatch.slice(0, 50)) {
		console.log(`  Walter #${n.walterId}: ${n.walterName}`);
	}
	if (noNameMatch.length > 50) {
		console.log(`  … and ${noNameMatch.length - 50} more (see JSON report)`);
	}

	console.log(`\n${"=".repeat(100)}`);
	console.log("SUMMARY");
	console.log("=".repeat(100));
	console.log(`  Walter bulk rows: ${walterRows.length}`);
	console.log(`  QR content duplicates: ${qrDuplicates.length}`);
	console.log(`  Name high (>=90%): ${highName.length}`);
	console.log(`  Name medium: ${mediumName.length}`);
	console.log(`  No name match: ${noNameMatch.length}`);

	const report = {
		generatedAt: new Date().toISOString(),
		options: { includePendingExisting, minSimilarity },
		summary: {
			walterRowCount: walterRows.length,
			qrContentDuplicates: qrDuplicates.length,
			nameHighCount: highName.length,
			nameMediumCount: mediumName.length,
			noNameMatchCount: noNameMatch.length,
		},
		qrContentDuplicates: qrDuplicates,
		nameMatchesHigh: highName,
		nameMatchesMedium: mediumName,
		noNameMatch,
	};

	fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
	fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
	console.log(`\nReport: ${REPORT_PATH}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
