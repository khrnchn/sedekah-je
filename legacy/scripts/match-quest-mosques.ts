#!/usr/bin/env bun
/**
 * Match unlinked quest mosques with existing institutions using fuzzy matching.
 * READ-ONLY — no writes to the database.
 */

import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { institutions, questMosques } from "@/db/schema";
import { findBestNameMatch } from "./_lib/institution-name-similarity";

interface QuestMosque {
	id: number;
	name: string;
	district: string;
}

interface Institution {
	id: number;
	name: string;
	city: string;
	state: string;
	category: string;
	status: string;
	slug: string;
}

interface Match {
	questMosque: QuestMosque;
	institution: Institution;
	similarity: number;
	normQuest: string;
	normInst: string;
	matchType: "exact" | "contains" | "levenshtein";
}

async function main() {
	console.log("Fetching unlinked quest mosques...");
	const unlinked = await db
		.select({
			id: questMosques.id,
			name: questMosques.name,
			district: questMosques.district,
		})
		.from(questMosques)
		.where(isNull(questMosques.institutionId))
		.orderBy(questMosques.name);

	console.log(`Found ${unlinked.length} unlinked quest mosques\n`);

	console.log(
		"Fetching approved institutions (masjid/surau in Selangor, schema-aligned categories)...",
	);
	const allInstitutions = await db
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
			and(
				eq(institutions.status, "approved"),
				eq(institutions.state, "Selangor"),
				inArray(institutions.category, ["masjid", "surau"]),
			),
		)
		.orderBy(institutions.name);

	console.log(
		`Found ${allInstitutions.length} approved Selangor masjid/surau\n`,
	);

	const highConfidence: Match[] = [];
	const mediumConfidence: Match[] = [];
	const noMatch: QuestMosque[] = [];

	for (const qm of unlinked) {
		const best = findBestNameMatch(qm.name, allInstitutions, {
			minLevenshteinSimilarity: 0.7,
		});

		if (best) {
			const m: Match = {
				questMosque: qm,
				institution: best.item,
				similarity: best.similarity,
				normQuest: best.normSource,
				normInst: best.normTarget,
				matchType: best.matchType,
			};
			if (best.similarity >= 0.9) {
				highConfidence.push(m);
			} else {
				mediumConfidence.push(m);
			}
		} else {
			noMatch.push(qm);
		}
	}

	highConfidence.sort((a, b) => b.similarity - a.similarity);
	mediumConfidence.sort((a, b) => b.similarity - a.similarity);

	console.log("=".repeat(100));
	console.log(
		`HIGH CONFIDENCE (>=90%) — ${highConfidence.length} matches — likely safe to auto-link`,
	);
	console.log("=".repeat(100));
	for (const m of highConfidence) {
		console.log(
			`\n  [${(m.similarity * 100).toFixed(1)}%] ${m.matchType.toUpperCase()}`,
		);
		console.log(`  Quest #${m.questMosque.id}: ${m.questMosque.name}`);
		console.log(
			`  Inst  #${m.institution.id}: ${m.institution.name} (${m.institution.city}) [${m.institution.category}]`,
		);
		console.log(`  Normalized: "${m.normQuest}" ↔ "${m.normInst}"`);
	}

	console.log(`\n${"=".repeat(100)}`);
	console.log(
		`MEDIUM CONFIDENCE (70-89%) — ${mediumConfidence.length} matches — needs human review`,
	);
	console.log("=".repeat(100));
	for (const m of mediumConfidence) {
		console.log(
			`\n  [${(m.similarity * 100).toFixed(1)}%] ${m.matchType.toUpperCase()}`,
		);
		console.log(`  Quest #${m.questMosque.id}: ${m.questMosque.name}`);
		console.log(
			`  Inst  #${m.institution.id}: ${m.institution.name} (${m.institution.city}) [${m.institution.category}]`,
		);
		console.log(`  Normalized: "${m.normQuest}" ↔ "${m.normInst}"`);
	}

	console.log(`\n${"=".repeat(100)}`);
	console.log(
		`NO MATCH — ${noMatch.length} quest mosques with no similar institution`,
	);
	console.log("=".repeat(100));
	for (const qm of noMatch) {
		console.log(`  Quest #${qm.id}: ${qm.name} (${qm.district})`);
	}

	console.log(`\n${"=".repeat(100)}`);
	console.log("SUMMARY");
	console.log("=".repeat(100));
	console.log(`  High confidence (>=90%): ${highConfidence.length}`);
	console.log(`  Medium confidence (70-89%): ${mediumConfidence.length}`);
	console.log(`  No match: ${noMatch.length}`);
	console.log(`  Total unlinked: ${unlinked.length}`);
}

main().catch(console.error);
