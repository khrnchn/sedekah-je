import { states as MALAYSIAN_STATES } from "@/lib/institution-constants";

export type MalaysianState = (typeof MALAYSIAN_STATES)[number];

/**
 * Maps free-text state labels (Google/OSM) to canonical `states` values.
 */
export function normalizeMalaysianState(
	raw: string | null | undefined,
): MalaysianState | null {
	if (!raw) return null;
	const t = raw.trim();
	const set = new Set<string>(MALAYSIAN_STATES as unknown as string[]);
	if (set.has(t)) return t as MalaysianState;

	const lower = t.toLowerCase();
	const aliases: Record<string, MalaysianState> = {
		penang: "Pulau Pinang",
		"pulau pinang": "Pulau Pinang",
		malacca: "Melaka",
		melaka: "Melaka",
		"negeri sembilan": "Negeri Sembilan",
		sabah: "Sabah",
		sarawak: "Sarawak",
		johor: "Johor",
		kedah: "Kedah",
		kelantan: "Kelantan",
		pahang: "Pahang",
		perak: "Perak",
		perlis: "Perlis",
		selangor: "Selangor",
		terengganu: "Terengganu",
		"wilayah persekutuan kuala lumpur": "W.P. Kuala Lumpur",
		"wilayah persekutuan labuan": "W.P. Labuan",
		"wilayah persekutuan putrajaya": "W.P. Putrajaya",
		"federal territory of kuala lumpur": "W.P. Kuala Lumpur",
		"kuala lumpur": "W.P. Kuala Lumpur",
		"wp kuala lumpur": "W.P. Kuala Lumpur",
		labuan: "W.P. Labuan",
		putrajaya: "W.P. Putrajaya",
	};

	if (aliases[lower]) return aliases[lower];

	for (const s of MALAYSIAN_STATES) {
		if (s.toLowerCase() === lower) return s;
	}
	return null;
}

type GoogleAddressComponent = {
	long_name: string;
	short_name: string;
	types: string[];
};

function pickFromComponents(
	components: GoogleAddressComponent[],
	type: string,
): string | undefined {
	return components.find((c) => c.types.includes(type))?.long_name;
}

function pickCityFromGoogleComponents(
	components: GoogleAddressComponent[],
): string {
	return (
		pickFromComponents(components, "locality") ??
		pickFromComponents(components, "administrative_area_level_2") ??
		pickFromComponents(components, "sublocality_level_1") ??
		pickFromComponents(components, "sublocality") ??
		pickFromComponents(components, "neighborhood") ??
		"Unknown"
	);
}

/**
 * Geocode a Malaysian institution by name only: tries Google (with address
 * components for state/city), then Nominatim + reverse lookup.
 */
export async function geocodeMalaysiaInstitutionByName(
	institutionName: string,
): Promise<{
	coords: [number, number];
	city: string;
	state: MalaysianState;
	address: string | null;
	needsManualReview: boolean;
} | null> {
	const name = institutionName.trim();
	if (!name) return null;

	const google = await geocodeGoogleMalaysiaWithComponents(name);
	if (google) return google;

	const nominatimCoords = await geocodeNominatimMalaysiaQuery(name);
	if (!nominatimCoords) return null;

	const rev = await reverseGeocodeInstitution(
		nominatimCoords[0],
		nominatimCoords[1],
	);
	const stateRaw = rev?.state ?? null;
	const mapped = normalizeMalaysianState(stateRaw);
	let needsManualReview = false;
	let state: MalaysianState;
	if (mapped) {
		state = mapped;
	} else {
		state = "W.P. Kuala Lumpur";
		needsManualReview = true;
	}

	const city = rev?.city?.trim() || "Unknown";
	if (city === "Unknown") needsManualReview = true;

	return {
		coords: nominatimCoords,
		city,
		state,
		address: rev?.addressLine ?? null,
		needsManualReview,
	};
}

async function geocodeGoogleMalaysiaWithComponents(
	institutionName: string,
): Promise<{
	coords: [number, number];
	city: string;
	state: MalaysianState;
	address: string | null;
	needsManualReview: boolean;
} | null> {
	const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
	if (!apiKey) return null;

	try {
		const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
		url.searchParams.set("address", institutionName);
		url.searchParams.set("components", "country:MY");
		url.searchParams.set("key", apiKey);
		url.searchParams.set("region", "my");
		url.searchParams.set("language", "ms");

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const res = await fetch(url.toString(), {
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!res.ok) return null;

		const data = (await res.json()) as {
			status: string;
			results?: Array<{
				formatted_address?: string;
				address_components?: GoogleAddressComponent[];
				geometry?: { location?: { lat?: number; lng?: number } };
			}>;
		};

		if (data.status !== "OK" || !data.results?.length) return null;

		const first = data.results[0];
		const loc = first.geometry?.location;
		if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number")
			return null;

		const components = first.address_components ?? [];
		const city = pickCityFromGoogleComponents(components);
		const stateLong = pickFromComponents(
			components,
			"administrative_area_level_1",
		);
		const mapped = normalizeMalaysianState(stateLong);
		let needsManualReview = false;
		let state: MalaysianState;

		if (mapped) {
			state = mapped;
		} else {
			state = "W.P. Kuala Lumpur";
			needsManualReview = true;
		}
		if (city === "Unknown") needsManualReview = true;

		return {
			coords: [loc.lat, loc.lng],
			city,
			state,
			address: first.formatted_address ?? null,
			needsManualReview,
		};
	} catch {
		return null;
	}
}

async function geocodeNominatimMalaysiaQuery(
	name: string,
): Promise<[number, number] | null> {
	try {
		const query = `${name}, Malaysia`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
			{
				headers: { "User-Agent": "sedekahje-bot" },
				signal: controller.signal,
			},
		);

		clearTimeout(timeoutId);

		if (!res.ok) return null;

		const results = (await res.json()) as Array<{ lat: string; lon: string }>;
		if (results.length === 0) return null;

		const lat = Number.parseFloat(results[0].lat);
		const lon = Number.parseFloat(results[0].lon);
		if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

		return [lat, lon];
	} catch {
		return null;
	}
}

/**
 * Reverse geocode coordinates using Nominatim (OpenStreetMap).
 * Returns a normalized display address string or null if lookup fails.
 */
export async function reverseGeocodeInstitution(
	lat: number,
	lon: number,
): Promise<{ addressLine: string; city?: string; state?: string } | null> {
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const res = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
			{
				headers: { "User-Agent": "sedekahje-bot" },
				signal: controller.signal,
			},
		);

		clearTimeout(timeoutId);

		if (!res.ok) return null;

		const data = (await res.json()) as {
			address?: {
				road?: string;
				house_number?: string;
				suburb?: string;
				village?: string;
				town?: string;
				city?: string;
				municipality?: string;
				state?: string;
				postcode?: string;
				country?: string;
			};
			display_name?: string;
		};

		const addr = data.address;
		if (!addr) return null;

		const parts: string[] = [];
		const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
		if (street) parts.push(street);
		const sub = addr.suburb ?? addr.village ?? addr.town ?? addr.municipality;
		if (sub) parts.push(sub);
		if (addr.city && sub !== addr.city) parts.push(addr.city);
		if (addr.state) parts.push(addr.state);
		if (addr.postcode) parts.push(addr.postcode);
		if (addr.country) parts.push(addr.country);

		const addressLine =
			parts.length > 0 ? parts.join(", ") : (data.display_name ?? "");
		if (!addressLine) return null;

		return {
			addressLine,
			city: addr.city ?? addr.town ?? addr.village ?? addr.municipality,
			state: addr.state,
		};
	} catch (err) {
		console.error("[reverse geocode]", err);
		return null;
	}
}

/**
 * Geocode an institution using Nominatim (OpenStreetMap).
 * Returns [latitude, longitude] or null if geocoding fails.
 */
export async function geocodeInstitution(
	name: string,
	city: string,
	state: string,
): Promise<[number, number] | null> {
	try {
		const query = `${name}, ${city}, ${state}, Malaysia`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);

		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
			{
				headers: { "User-Agent": "sedekahje-bot" },
				signal: controller.signal,
			},
		);

		clearTimeout(timeoutId);

		if (!res.ok) return null;

		const results = (await res.json()) as Array<{ lat: string; lon: string }>;
		if (results.length === 0) return null;

		const lat = Number.parseFloat(results[0].lat);
		const lon = Number.parseFloat(results[0].lon);
		if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

		return [lat, lon];
	} catch {
		return null;
	}
}

/**
 * Geocode an institution using Google Geocoding API.
 * Returns [latitude, longitude] or null if geocoding fails.
 * Requires GOOGLE_GEOCODING_API_KEY env var.
 */
export async function geocodeWithGoogle(
	name: string,
	city: string,
	state: string,
): Promise<[number, number] | null> {
	const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
	if (!apiKey) return null;

	try {
		const query = `${name}, ${city}, ${state}, Malaysia`;
		const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
		url.searchParams.set("address", query);
		url.searchParams.set("key", apiKey);
		url.searchParams.set("region", "my");
		url.searchParams.set("language", "ms");

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const res = await fetch(url.toString(), {
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!res.ok) return null;

		const data = (await res.json()) as {
			status: string;
			results?: Array<{
				geometry?: { location?: { lat?: number; lng?: number } };
			}>;
		};

		if (data.status !== "OK" || !data.results?.length) return null;

		const loc = data.results[0].geometry?.location;
		if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number")
			return null;

		return [loc.lat, loc.lng];
	} catch {
		return null;
	}
}

/**
 * Reverse geocode coordinates using Google Geocoding API.
 * Returns a formatted address string or null if lookup fails.
 * Requires GOOGLE_GEOCODING_API_KEY env var.
 */
export async function reverseGeocodeWithGoogle(
	lat: number,
	lon: number,
): Promise<string | null> {
	const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
	if (!apiKey) return null;

	try {
		const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
		url.searchParams.set("latlng", `${lat},${lon}`);
		url.searchParams.set("key", apiKey);
		url.searchParams.set("language", "ms");

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 8000);

		const res = await fetch(url.toString(), {
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!res.ok) return null;

		const data = (await res.json()) as {
			status: string;
			results?: Array<{ formatted_address?: string }>;
		};

		if (data.status !== "OK" || !data.results?.length) return null;

		return data.results[0].formatted_address ?? null;
	} catch {
		return null;
	}
}

/**
 * Geocode with Google Maps first, fallback to Nominatim.
 */
export async function geocodeInstitutionWithFallback(
	name: string,
	city: string,
	state: string,
): Promise<[number, number] | null> {
	const google = await geocodeWithGoogle(name, city, state);
	if (google) return google;

	return geocodeInstitution(name, city, state);
}
