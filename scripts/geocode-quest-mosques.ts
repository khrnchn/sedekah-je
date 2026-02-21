import { and, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { questMosques } from "@/db/schema";

type NominatimResult = {
	lat: string;
	lon: string;
	display_name?: string;
	address?: {
		country_code?: string;
		state?: string;
		county?: string;
		city?: string;
		town?: string;
		village?: string;
		suburb?: string;
	};
};

const BASE_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_PAUSE_MS = 1100;

function getArgValue(flag: string): string | null {
	const idx = process.argv.indexOf(flag);
	if (idx === -1 || idx + 1 >= process.argv.length) return null;
	return process.argv[idx + 1] ?? null;
}

const limitArg = getArgValue("--limit");
const pauseArg = getArgValue("--pause-ms");
const dryRun = process.argv.includes("--dry-run");
const limit = limitArg ? Number.parseInt(limitArg, 10) : 0;
const pauseMs = pauseArg ? Number.parseInt(pauseArg, 10) : DEFAULT_PAUSE_MS;
const email = process.env.NOMINATIM_EMAIL;

if (!email) {
	console.error(
		"Missing NOMINATIM_EMAIL env var. Nominatim requires a contact email.",
	);
	process.exit(1);
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocode(query: string): Promise<NominatimResult | null> {
	const url = new URL(BASE_URL);
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("limit", "1");
	url.searchParams.set("q", query);
	url.searchParams.set("email", email);
	url.searchParams.set("countrycodes", "my");
	url.searchParams.set("addressdetails", "1");
	url.searchParams.set("accept-language", "ms,en");

	const res = await fetch(url, {
		headers: {
			"User-Agent": `sedekah-je-quest-geocode/1.0 (${email})`,
		},
	});
	if (!res.ok) {
		console.warn(`Nominatim failed (${res.status}) for: ${query}`);
		return null;
	}
	const data = (await res.json()) as NominatimResult[];
	return data[0] ?? null;
}

function isLikelySelangor(result: NominatimResult | null): boolean {
	if (!result?.address) return true;
	const { country_code, state, county, city, town, suburb } = result.address;
	if (country_code && country_code.toLowerCase() !== "my") return false;
	const haystack = [state, county, city, town, suburb]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();
	return haystack.includes("selangor") || haystack.includes("petaling");
}

function buildQuery(mosque: {
	name: string;
	address: string | null;
	district: string;
}) {
	const normalizedName = normalizeName(mosque.name);
	const baseParts = [normalizedName, mosque.address].filter(Boolean);
	const district = mosque.district || "Petaling";
	const cityFallbacks = [
		"Petaling Jaya",
		"Shah Alam",
		"Subang Jaya",
		"Puchong",
		"Kota Damansara",
		"Sungai Buloh",
		"Seri Kembangan",
	];

	const nameVariants = [
		normalizedName,
		normalizedName.replace(/^masjid\\s+/i, "").trim(),
		normalizedName.replace(/[,]/g, " ").replace(/\\s+/g, " ").trim(),
	];

	const variants = [
		[...baseParts, district, "Selangor", "Malaysia"],
		...nameVariants.map((name) => [name, district, "Selangor", "Malaysia"]),
		...nameVariants.map((name) => [name, "Petaling", "Selangor", "Malaysia"]),
		...nameVariants.map((name) => [name, "Selangor", "Malaysia"]),
		...cityFallbacks.flatMap((city) =>
			nameVariants.map((name) => [name, city, "Selangor", "Malaysia"]),
		),
	];
	return variants.map((parts) => parts.filter(Boolean).join(", "));
}

function normalizeName(name: string) {
	return name
		.replace(/\u0060/g, "'")
		.replace(/\bSEK\.\b/gi, "SEKSYEN")
		.replace(/\bSEKSYEN\b/gi, "SEKSYEN")
		.replace(/\bKG\b/gi, "KAMPUNG")
		.replace(/\bTTDI\b/gi, "Taman Tun Dr Ismail")
		.replace(/\bSS\b/gi, "SS")
		.replace(/\s+/g, " ")
		.trim();
}

async function main() {
	const rows = await db
		.select({
			id: questMosques.id,
			name: questMosques.name,
			address: questMosques.address,
			district: questMosques.district,
		})
		.from(questMosques)
		.where(and(isNull(questMosques.coords), sql`true`))
		.orderBy(questMosques.id)
		.limit(limit > 0 ? limit : undefined);

	if (rows.length === 0) {
		console.log("No quest mosques missing coords.");
		return;
	}

	console.log(
		`Geocoding ${rows.length} quest mosques${dryRun ? " (dry-run)" : ""}...`,
	);

	let updated = 0;

	for (const row of rows) {
		const queries = buildQuery(row);
		let found: NominatimResult | null = null;

		for (const query of queries) {
			const result = await geocode(query);
			if (result && isLikelySelangor(result)) {
				found = result;
				break;
			}
			// Respect Nominatim usage policy (1 req/sec)
			await sleep(pauseMs);
		}

		if (!found) {
			console.log(`[miss] ${row.id} ${row.name}`);
		} else {
			const coords: [number, number] = [
				Number.parseFloat(found.lat),
				Number.parseFloat(found.lon),
			];
			if (Number.isNaN(coords[0]) || Number.isNaN(coords[1])) {
				console.log(`[miss] ${row.id} ${row.name} (invalid coords)`);
			} else {
				if (!dryRun) {
					await db
						.update(questMosques)
						.set({ coords })
						.where(sql`${questMosques.id} = ${row.id}`);
				}
				updated += 1;
				console.log(`[ok] ${row.id} ${row.name} → ${coords[0]}, ${coords[1]}`);
				if (found.display_name) {
					console.log(`     match: ${found.display_name}`);
				}
			}
		}

		// Respect Nominatim usage policy (1 req/sec)
		await sleep(pauseMs);
	}

	console.log(`Done. Updated ${updated}/${rows.length}.`);
}

main().catch((err) => {
	console.error("Geocode failed:", err);
	process.exit(1);
});
