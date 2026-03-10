#!/usr/bin/env bun
/**
 * Match unlinked quest mosques with existing institutions using fuzzy matching.
 * READ-ONLY — no writes to the database.
 */

import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { institutions, questMosques } from "@/db/schema";

// --- Normalization & matching logic (from feature/similar-institutions-warning) ---

const COMMON_PREFIXES = [
	"masjid jamek",
	"masjid kampung",
	"masjid mukim",
	"masjid daerah",
	"masjid kariah",
	"masjid taman",
	"masjid sultan",
	"masjid bandar",
	"masjid",
	"surau taman",
	"surau kampung",
	"surau",
	"tabung masjid",
];

// Malaysian abbreviation expansions
const ABBREVIATIONS: Record<string, string> = {
	kg: "kampung",
	"kg.": "kampung",
	sg: "sungai",
	"sg.": "sungai",
	jln: "jalan",
	sek: "seksyen",
	"sek.": "seksyen",
	tmn: "taman",
	dr: "darul",
	"bt.": "bukit",
	bt: "bukit",
};

function expandAbbreviations(name: string): string {
	return name
		.split(/\s+/)
		.map((word) => ABBREVIATIONS[word.toLowerCase()] || word)
		.join(" ");
}

function normalizeName(name: string): string {
	let normalized = expandAbbreviations(name)
		.toLowerCase()
		.replace(/[`'".,/#!$%^&*;:{}=\-_~()]/g, "")
		.replace(/\s+/g, " ")
		.trim();

	// Remove common prefixes (longest first — array is ordered that way)
	for (const prefix of COMMON_PREFIXES) {
		if (normalized.startsWith(prefix + " ")) {
			normalized = normalized.slice(prefix.length).trim();
			break;
		}
		if (normalized === prefix) {
			normalized = "";
			break;
		}
	}

	// Remove all remaining spaces for final comparison
	return normalized.replace(/\s+/g, "");
}

function levenshteinDistance(a: string, b: string): number {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1,
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

function similarityScore(a: string, b: string): number {
	const distance = levenshteinDistance(a, b);
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	return 1 - distance / maxLen;
}

// --- Also check if one normalized name contains the other ---
function containsMatch(a: string, b: string): boolean {
	if (a.length === 0 || b.length === 0) return false;
	const shorter = a.length <= b.length ? a : b;
	const longer = a.length > b.length ? a : b;
	// If the shorter string is at least 5 chars and is fully contained
	return shorter.length >= 5 && longer.includes(shorter);
}

// --- Main ---

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

	console.log("Fetching approved institutions (mosque/masjid in Selangor)...");
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
				inArray(institutions.category, ["mosque", "masjid"]),
			),
		)
		.orderBy(institutions.name);

	console.log(`Found ${allInstitutions.length} approved Selangor mosques\n`);

	const highConfidence: Match[] = [];
	const mediumConfidence: Match[] = [];
	const noMatch: QuestMosque[] = [];

	for (const qm of unlinked) {
		const normQ = normalizeName(qm.name);
		let bestMatch: Match | null = null;

		for (const inst of allInstitutions) {
			const normI = normalizeName(inst.name);

			// Exact normalized match
			if (normQ === normI && normQ.length > 0) {
				const match: Match = {
					questMosque: qm,
					institution: inst,
					similarity: 1.0,
					normQuest: normQ,
					normInst: normI,
					matchType: "exact",
				};
				if (!bestMatch || match.similarity > bestMatch.similarity) {
					bestMatch = match;
				}
				continue;
			}

			// Contains match
			if (containsMatch(normQ, normI)) {
				const sim = similarityScore(normQ, normI);
				const effectiveSim = Math.max(sim, 0.85); // boost contains matches
				const match: Match = {
					questMosque: qm,
					institution: inst,
					similarity: effectiveSim,
					normQuest: normQ,
					normInst: normI,
					matchType: "contains",
				};
				if (!bestMatch || match.similarity > bestMatch.similarity) {
					bestMatch = match;
				}
				continue;
			}

			// Levenshtein match
			const sim = similarityScore(normQ, normI);
			if (sim >= 0.7) {
				const match: Match = {
					questMosque: qm,
					institution: inst,
					similarity: sim,
					normQuest: normQ,
					normInst: normI,
					matchType: "levenshtein",
				};
				if (!bestMatch || match.similarity > bestMatch.similarity) {
					bestMatch = match;
				}
			}
		}

		if (bestMatch) {
			if (bestMatch.similarity >= 0.9) {
				highConfidence.push(bestMatch);
			} else {
				mediumConfidence.push(bestMatch);
			}
		} else {
			noMatch.push(qm);
		}
	}

	// Sort by similarity descending
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

	console.log("\n" + "=".repeat(100));
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

	console.log("\n" + "=".repeat(100));
	console.log(
		`NO MATCH — ${noMatch.length} quest mosques with no similar institution`,
	);
	console.log("=".repeat(100));
	for (const qm of noMatch) {
		console.log(`  Quest #${qm.id}: ${qm.name} (${qm.district})`);
	}

	console.log("\n" + "=".repeat(100));
	console.log("SUMMARY");
	console.log("=".repeat(100));
	console.log(`  High confidence (>=90%): ${highConfidence.length}`);
	console.log(`  Medium confidence (70-89%): ${mediumConfidence.length}`);
	console.log(`  No match: ${noMatch.length}`);
	console.log(`  Total unlinked: ${unlinked.length}`);
}

main().catch(console.error);
