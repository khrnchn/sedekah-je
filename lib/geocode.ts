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
