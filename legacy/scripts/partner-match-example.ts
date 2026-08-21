#!/usr/bin/env bun
/**
 * Standalone example: match a partner mosque list against a sedekah.je export.
 *
 * Partner integration steps:
 *   1. Get the sedekah.je approved institutions export from the sedekah.je team.
 *      The export includes public matching fields, `qrContent`, `institutionUrl`,
 *      and `embedUrl`. It does not include internal review fields or QR proof images.
 *   2. Export your own mosque list as JSON with at least `id` and `name`.
 *      Add `state`, `city`, and `coords` when available for better matching.
 *   3. Run this script against both files.
 *   4. Auto-link `high` confidence matches only if that fits your risk tolerance.
 *      Review `medium` confidence matches manually.
 *   5. Store the matched `sedekahSlug` in your own database.
 *   6. To show the donation QR, either:
 *      - open/embed `embedUrl`, recommended for consistent sedekah.je rendering; or
 *      - render your own QR from `qrContent` for a fully native mobile UI.
 *   7. For `none` matches, keep them unmapped or submit missing QRs back to sedekah.je.
 *
 * Usage:
 *   bun partner-match-example.ts \
 *     --partner partner-mosques.json \
 *     --sedekah sedekah-je-approved-institutions.json \
 *     --out sedekah-match-report.json
 *
 * Expected partner input:
 *   [
 *     {
 *       "id": "partner-mosque-123",
 *       "name": "Masjid Al-Hidayah",
 *       "state": "Selangor",
 *       "city": "Petaling Jaya",
 *       "coords": [3.1, 101.6]
 *     }
 *   ]
 *
 * Expected sedekah input:
 *   The JSON downloaded from sedekah.je admin export, either:
 *   { "data": [...] }
 *   or just an array of institutions.
 */

import * as fs from "node:fs";

type RawRecord = Record<string, unknown>;

type PartnerMosque = {
	id: string;
	name: string;
	state: string | null;
	city: string | null;
	coords: [number, number] | null;
	raw: RawRecord;
};

type SedekahInstitution = {
	slug: string;
	name: string;
	state: string | null;
	city: string | null;
	category: string | null;
	coords: [number, number] | null;
	embedUrl: string | null;
	institutionUrl: string | null;
	raw: RawRecord;
};

type MatchResult = {
	partnerId: string;
	partnerName: string;
	confidence: "high" | "medium" | "none";
	score: number;
	matchType: "exact" | "contains" | "levenshtein" | "none";
	sedekahSlug: string | null;
	sedekahName: string | null;
	sedekahState: string | null;
	sedekahCity: string | null;
	distanceKm: number | null;
	embedUrl: string | null;
	institutionUrl: string | null;
};

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

function usage() {
	console.log(`Usage:
  bun partner-match-example.ts --partner partner.json --sedekah sedekah-export.json --out report.json

Options:
  --partner <path>   Partner mosque JSON array
  --sedekah <path>   sedekah.je export JSON
  --out <path>       Output report path, default: sedekah-match-report.json
  --min <number>     Minimum medium confidence score, default: 0.7
`);
}

function parseArgs(argv: string[]) {
	let partnerPath = "";
	let sedekahPath = "";
	let outPath = "sedekah-match-report.json";
	let minScore = 0.7;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		const next = argv[i + 1];
		if (arg === "--partner" && next) {
			partnerPath = next;
			i++;
		} else if (arg === "--sedekah" && next) {
			sedekahPath = next;
			i++;
		} else if (arg === "--out" && next) {
			outPath = next;
			i++;
		} else if (arg === "--min" && next) {
			minScore = Number.parseFloat(next);
			i++;
		} else if (arg === "--help" || arg === "-h") {
			usage();
			process.exit(0);
		}
	}

	if (!partnerPath || !sedekahPath) {
		usage();
		throw new Error("--partner and --sedekah are required");
	}
	if (!Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
		throw new Error("--min must be a number between 0 and 1");
	}

	return { partnerPath, sedekahPath, outPath, minScore };
}

function readJson(path: string): unknown {
	return JSON.parse(fs.readFileSync(path, "utf8"));
}

function asString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asCoords(row: RawRecord): [number, number] | null {
	const coords = row.coords;
	if (
		Array.isArray(coords) &&
		coords.length >= 2 &&
		typeof coords[0] === "number" &&
		typeof coords[1] === "number"
	) {
		return [coords[0], coords[1]];
	}

	const lat = row.lat ?? row.latitude;
	const lng = row.lng ?? row.lon ?? row.longitude;
	const latNumber =
		typeof lat === "number" ? lat : typeof lat === "string" ? Number(lat) : NaN;
	const lngNumber =
		typeof lng === "number" ? lng : typeof lng === "string" ? Number(lng) : NaN;

	if (Number.isFinite(latNumber) && Number.isFinite(lngNumber)) {
		return [latNumber, lngNumber];
	}

	return null;
}

function normalizeName(name: string): string {
	let normalized = name
		.split(/\s+/)
		.map((word) => ABBREVIATIONS[word.toLowerCase()] ?? word)
		.join(" ")
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
	for (let i = 0; i <= b.length; i++) matrix[i] = [i];
	for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

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
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	return 1 - levenshteinDistance(a, b) / maxLen;
}

function containsMatch(a: string, b: string): boolean {
	if (a.length === 0 || b.length === 0) return false;
	const shorter = a.length <= b.length ? a : b;
	const longer = a.length > b.length ? a : b;
	return shorter.length >= 5 && longer.includes(shorter);
}

function distanceKm(a: [number, number] | null, b: [number, number] | null) {
	if (!a || !b) return null;
	const radiusKm = 6371;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b[0] - a[0]);
	const dLng = toRad(b[1] - a[1]);
	const lat1 = toRad(a[0]);
	const lat2 = toRad(b[0]);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
	return 2 * radiusKm * Math.asin(Math.sqrt(h));
}

function loadPartnerRows(path: string): PartnerMosque[] {
	const parsed = readJson(path);
	const rows = Array.isArray(parsed) ? parsed : [];
	return rows
		.filter((row): row is RawRecord => Boolean(row) && typeof row === "object")
		.map((row, index) => ({
			id:
				asString(row.id) ??
				asString(row.ref) ??
				asString(row.slug) ??
				String(index + 1),
			name: asString(row.name) ?? "",
			state: asString(row.state),
			city: asString(row.city) ?? asString(row.district),
			coords: asCoords(row),
			raw: row,
		}))
		.filter((row) => row.name);
}

function loadSedekahRows(path: string): SedekahInstitution[] {
	const parsed = readJson(path);
	const rows =
		parsed &&
		typeof parsed === "object" &&
		"data" in parsed &&
		Array.isArray((parsed as { data: unknown }).data)
			? (parsed as { data: unknown[] }).data
			: Array.isArray(parsed)
				? parsed
				: [];

	return rows
		.filter((row): row is RawRecord => Boolean(row) && typeof row === "object")
		.map((row) => ({
			slug: asString(row.slug) ?? "",
			name: asString(row.name) ?? "",
			state: asString(row.state),
			city: asString(row.city),
			category: asString(row.category),
			coords: asCoords(row),
			embedUrl: asString(row.embedUrl),
			institutionUrl: asString(row.institutionUrl),
			raw: row,
		}))
		.filter((row) => row.slug && row.name);
}

function scorePair(partner: PartnerMosque, sedekah: SedekahInstitution) {
	const normPartner = normalizeName(partner.name);
	const normSedekah = normalizeName(sedekah.name);

	let score = similarityScore(normPartner, normSedekah);
	let matchType: MatchResult["matchType"] = "levenshtein";

	if (normPartner && normPartner === normSedekah) {
		score = 1;
		matchType = "exact";
	} else if (containsMatch(normPartner, normSedekah)) {
		score = Math.max(score, 0.85);
		matchType = "contains";
	}

	if (
		partner.state &&
		sedekah.state &&
		partner.state.toLowerCase() === sedekah.state.toLowerCase()
	) {
		score += 0.04;
	}
	if (
		partner.city &&
		sedekah.city &&
		partner.city.toLowerCase() === sedekah.city.toLowerCase()
	) {
		score += 0.03;
	}

	const km = distanceKm(partner.coords, sedekah.coords);
	if (km !== null) {
		if (km <= 0.25) score += 0.1;
		else if (km <= 1) score += 0.06;
		else if (km <= 3) score += 0.03;
		else if (km >= 20) score -= 0.1;
	}

	return {
		score: Math.max(0, Math.min(1, score)),
		matchType,
		distanceKm: km,
	};
}

function findBestMatch(
	partner: PartnerMosque,
	candidates: SedekahInstitution[],
	minScore: number,
): MatchResult {
	let best:
		| (ReturnType<typeof scorePair> & { institution: SedekahInstitution })
		| null = null;

	for (const candidate of candidates) {
		const scored = scorePair(partner, candidate);
		if (!best || scored.score > best.score) {
			best = { ...scored, institution: candidate };
		}
	}

	if (!best || best.score < minScore) {
		return {
			partnerId: partner.id,
			partnerName: partner.name,
			confidence: "none",
			score: best?.score ?? 0,
			matchType: "none",
			sedekahSlug: null,
			sedekahName: null,
			sedekahState: null,
			sedekahCity: null,
			distanceKm: best?.distanceKm ?? null,
			embedUrl: null,
			institutionUrl: null,
		};
	}

	return {
		partnerId: partner.id,
		partnerName: partner.name,
		confidence: best.score >= 0.9 ? "high" : "medium",
		score: Number(best.score.toFixed(4)),
		matchType: best.matchType,
		sedekahSlug: best.institution.slug,
		sedekahName: best.institution.name,
		sedekahState: best.institution.state,
		sedekahCity: best.institution.city,
		distanceKm:
			best.distanceKm === null ? null : Number(best.distanceKm.toFixed(3)),
		embedUrl: best.institution.embedUrl,
		institutionUrl: best.institution.institutionUrl,
	};
}

function main() {
	const { partnerPath, sedekahPath, outPath, minScore } = parseArgs(
		process.argv.slice(2),
	);
	const partnerRows = loadPartnerRows(partnerPath);
	const sedekahRows = loadSedekahRows(sedekahPath);

	const matches = partnerRows.map((row) =>
		findBestMatch(row, sedekahRows, minScore),
	);

	const report = {
		generatedAt: new Date().toISOString(),
		input: {
			partnerCount: partnerRows.length,
			sedekahCount: sedekahRows.length,
			minScore,
		},
		summary: {
			high: matches.filter((m) => m.confidence === "high").length,
			medium: matches.filter((m) => m.confidence === "medium").length,
			none: matches.filter((m) => m.confidence === "none").length,
		},
		matches,
	};

	fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
	console.log(`Wrote ${outPath}`);
	console.log(report.summary);
}

main();
