/**
 * Shared fuzzy name matching for institution scripts (quest matcher, Walter audit).
 * Same normalization as historical feature/similar-institutions-warning.
 */

export type NameMatchType = "exact" | "contains" | "levenshtein";

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

export function normalizeName(name: string): string {
	let normalized = expandAbbreviations(name)
		.toLowerCase()
		.replace(/[`'".,/#!$%^&*;:{}=\-_~()]/g, "")
		.replace(/\s+/g, " ")
		.trim();

	for (const prefix of COMMON_PREFIXES) {
		if (normalized.startsWith(`${prefix} `)) {
			normalized = normalized.slice(prefix.length).trim();
			break;
		}
		if (normalized === prefix) {
			normalized = "";
			break;
		}
	}

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

export function similarityScore(a: string, b: string): number {
	const distance = levenshteinDistance(a, b);
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	return 1 - distance / maxLen;
}

export function containsMatch(a: string, b: string): boolean {
	if (a.length === 0 || b.length === 0) return false;
	const shorter = a.length <= b.length ? a : b;
	const longer = a.length > b.length ? a : b;
	return shorter.length >= 5 && longer.includes(shorter);
}

export type BestNameMatch<T> = {
	item: T;
	similarity: number;
	matchType: NameMatchType;
	normSource: string;
	normTarget: string;
};

/**
 * Best fuzzy match of `sourceName` against `candidates` (by highest similarity).
 */
export function findBestNameMatch<T extends { name: string }>(
	sourceName: string,
	candidates: T[],
	options: { minLevenshteinSimilarity?: number } = {},
): BestNameMatch<T> | null {
	const minLev = options.minLevenshteinSimilarity ?? 0.7;
	const normQ = normalizeName(sourceName);
	let best: BestNameMatch<T> | null = null;

	for (const inst of candidates) {
		const normI = normalizeName(inst.name);

		if (normQ === normI && normQ.length > 0) {
			const match: BestNameMatch<T> = {
				item: inst,
				similarity: 1.0,
				matchType: "exact",
				normSource: normQ,
				normTarget: normI,
			};
			if (!best || match.similarity > best.similarity) best = match;
			continue;
		}

		if (containsMatch(normQ, normI)) {
			const sim = similarityScore(normQ, normI);
			const effectiveSim = Math.max(sim, 0.85);
			const match: BestNameMatch<T> = {
				item: inst,
				similarity: effectiveSim,
				matchType: "contains",
				normSource: normQ,
				normTarget: normI,
			};
			if (!best || match.similarity > best.similarity) best = match;
			continue;
		}

		const sim = similarityScore(normQ, normI);
		if (sim >= minLev) {
			const match: BestNameMatch<T> = {
				item: inst,
				similarity: sim,
				matchType: "levenshtein",
				normSource: normQ,
				normTarget: normI,
			};
			if (!best || match.similarity > best.similarity) best = match;
		}
	}

	return best;
}
