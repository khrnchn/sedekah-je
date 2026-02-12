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
