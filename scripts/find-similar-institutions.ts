#!/usr/bin/env bun
/**
 * Find potentially duplicate institutions using fuzzy matching.
 *
 * Usage:
 *   bun run scripts/find-similar-institutions.ts
 *
 * This is a read-only operation - no destructive queries.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/schema";

const COMMON_PREFIXES = [
	"masjid",
	"surau",
	"masjid jamek",
	"masjid kampung",
	"masjid mukim",
	"masjid daerah",
	"masjid kariah",
	"masjid taman",
	"masjid sultan",
	"masjid Bandar",
	"surau taman",
	"surau kampung",
	"tabung masjid",
];

function normalizeName(name: string): string {
	let normalized = name
		.toLowerCase()
		.replace(/[\s\-_.,/#!$%^&*;:{}=\-_`~()]/g, "")
		.replace(/[^\w\u0600-\u06FF]/g, "");

	for (const prefix of COMMON_PREFIXES) {
		const prefixNorm = prefix.replace(/[\s\-_.,/#!$%^&*;:{}=\-_`~()]/g, "");
		if (normalized.startsWith(prefixNorm)) {
			normalized = normalized.slice(prefixNorm.length);
		}
	}

	return normalized;
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

function isSimilar(a: string, b: string, threshold = 3): boolean {
	const distance = levenshteinDistance(a, b);
	const maxLen = Math.max(a.length, b.length);
	const similarity = 1 - distance / maxLen;
	return similarity >= 0.75 || distance <= threshold;
}

interface Institution {
	id: number;
	name: string;
	category: string;
	city: string;
	state: string;
	slug: string;
	status: string;
}

async function main() {
	console.log("Fetching all approved institutions...\n");

	const allInstitutions = await db
		.select({
			id: institutions.id,
			name: institutions.name,
			category: institutions.category,
			city: institutions.city,
			state: institutions.state,
			slug: institutions.slug,
			status: institutions.status,
		})
		.from(institutions)
		.where(eq(institutions.status, "approved"))
		.orderBy(institutions.state, institutions.category, institutions.name);

	console.log(`Found ${allInstitutions.length} approved institutions\n`);

	const pairs: {
		inst1: Institution;
		inst2: Institution;
		distance: number;
		similarity: number;
	}[] = [];

	for (let i = 0; i < allInstitutions.length; i++) {
		for (let j = i + 1; j < allInstitutions.length; j++) {
			const a = allInstitutions[i];
			const b = allInstitutions[j];

			if (a.state !== b.state || a.category !== b.category) continue;

			const cityA = (a.city || "").toLowerCase().trim();
			const cityB = (b.city || "").toLowerCase().trim();
			const sameCity = cityA === cityB && cityA !== "";

			if (!sameCity) continue;

			const normA = normalizeName(a.name);
			const normB = normalizeName(b.name);

			if (normA === normB) continue;

			if (isSimilar(normA, normB)) {
				const distance = levenshteinDistance(normA, normB);
				const maxLen = Math.max(normA.length, normB.length);
				const similarity = 1 - distance / maxLen;

				pairs.push({ inst1: a, inst2: b, distance, similarity });
			}
		}
	}

	console.log(`Found ${pairs.length} potentially similar pairs\n`);
	console.log("=".repeat(80));

	if (pairs.length === 0) {
		console.log("No similar institutions found!");
		return;
	}

	pairs.sort((a, b) => a.similarity - b.similarity);

	for (const pair of pairs) {
		const p = pair;
		console.log(
			`\n[${(p.similarity * 100).toFixed(1)}% similarity | dist=${p.distance}]`,
		);
		console.log(
			`  1. ${p.inst1.name} (${p.inst1.city}, ${p.inst1.state}) [ID: ${p.inst1.id}]`,
		);
		console.log(
			`  2. ${p.inst2.name} (${p.inst2.city}, ${p.inst2.state}) [ID: ${p.inst2.id}]`,
		);
		console.log(`  URL: /${p.inst2.slug}`);
	}
}

main().catch(console.error);
