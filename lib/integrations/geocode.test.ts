import assert from "node:assert/strict";
import { test } from "node:test";
import { geocodeMalaysiaInstitutionByName } from "./geocode";

test("institution lookup identifies Google and its Nominatim fallback", async () => {
	const originalFetch = globalThis.fetch;
	const originalKey = process.env.GOOGLE_GEOCODING_API_KEY;
	process.env.GOOGLE_GEOCODING_API_KEY = "test-only";
	let googleAvailable = true;
	const hosts: string[] = [];
	globalThis.fetch = async (input) => {
		const url = new URL(String(input));
		hosts.push(url.hostname);
		if (url.hostname === "maps.googleapis.com")
			return Response.json(
				googleAvailable
					? {
							status: "OK",
							results: [
								{
									formatted_address: "Jalan Amanah",
									geometry: { location: { lat: 3.1, lng: 101.6 } },
									address_components: [
										{
											long_name: "Petaling Jaya",
											short_name: "PJ",
											types: ["locality"],
										},
										{
											long_name: "Selangor",
											short_name: "SGR",
											types: ["administrative_area_level_1"],
										},
									],
								},
							],
						}
					: { status: "REQUEST_DENIED" },
			);
		assert.equal(url.hostname, "nominatim.openstreetmap.org");
		return Response.json(
			url.pathname === "/search"
				? [{ lat: "3.1", lon: "101.6" }]
				: {
						address: {
							road: "Jalan Amanah",
							city: "Petaling Jaya",
							state: "Selangor",
						},
					},
		);
	};
	try {
		assert.equal(
			(
				await geocodeMalaysiaInstitutionByName(
					"Masjid Amanah, Petaling Jaya, Selangor",
				)
			)?.provider,
			"google",
		);
		assert.deepEqual(hosts, ["maps.googleapis.com"]);
		googleAvailable = false;
		hosts.length = 0;
		assert.equal(
			(
				await geocodeMalaysiaInstitutionByName(
					"Masjid Amanah, Petaling Jaya, Selangor",
				)
			)?.provider,
			"nominatim",
		);
		assert.deepEqual(hosts, [
			"maps.googleapis.com",
			"nominatim.openstreetmap.org",
			"nominatim.openstreetmap.org",
		]);
	} finally {
		globalThis.fetch = originalFetch;
		if (originalKey === undefined) delete process.env.GOOGLE_GEOCODING_API_KEY;
		else process.env.GOOGLE_GEOCODING_API_KEY = originalKey;
	}
});
