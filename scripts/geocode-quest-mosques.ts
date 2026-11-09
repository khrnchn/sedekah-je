import { and, eq, isNull, sql } from "drizzle-orm";
import type { FeatureCollection, Position } from "geojson";
import { db } from "@/db";
import { questMosques } from "@/db/schema";
import districts from "../data/selangor-districts.json";

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
const districtArg = getArgValue("--district");
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

// Ray casting over every ring; holes toggle inside/outside so they are honoured.
function inRings(rings: Position[][], lat: number, lon: number) {
	let inside = false;
	for (const ring of rings) {
		for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
			const [xi, yi] = ring[i];
			const [xj, yj] = ring[j];
			if (
				yi > lat !== yj > lat &&
				lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
			)
				inside = !inside;
		}
	}
	return inside;
}

// Name-only fallbacks happily match a same-named mosque in another town, so a
// result only counts when it lands inside the mosque's own district.
function insideDistrict(result: NominatimResult, district: string) {
	const feature = (districts as FeatureCollection).features.find(
		(f) => f.properties?.name === district,
	);
	if (!feature) return false;
	const lat = Number.parseFloat(result.lat);
	const lon = Number.parseFloat(result.lon);
	const geometry = feature.geometry;
	if (geometry.type === "Polygon")
		return inRings(geometry.coordinates, lat, lon);
	if (geometry.type === "MultiPolygon")
		return geometry.coordinates.some((polygon) => inRings(polygon, lat, lon));
	return false;
}

function buildQuery(mosque: {
	name: string;
	address: string | null;
	district: string;
}) {
	const normalizedName = normalizeName(mosque.name);
	const baseParts = [normalizedName, mosque.address].filter(Boolean);
	const nameVariants = [
		normalizedName,
		normalizedName.replace(/^masjid\s+/i, "").trim(),
		normalizedName.replace(/,\s*/g, " ").replace(/\s+/g, " ").trim(),
	];

	const variants = [
		[...baseParts, mosque.district, "Selangor", "Malaysia"],
		[mosque.address, mosque.district, "Selangor", "Malaysia"],
		...nameVariants.map((name) => [
			name,
			mosque.district,
			"Selangor",
			"Malaysia",
		]),
		...nameVariants.map((name) => [name, "Selangor", "Malaysia"]),
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
		.where(
			and(
				isNull(questMosques.coords),
				districtArg ? eq(questMosques.district, districtArg) : undefined,
			),
		)
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
			if (result && insideDistrict(result, row.district)) {
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
