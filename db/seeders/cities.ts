import { eq } from "drizzle-orm";
import type { PoolClient } from "pg";
import { db } from "..";
import { malaysianCities, malaysianStates } from "../schema";

export async function seedCities(client: PoolClient) {
	console.log("🌱 Seeding Malaysian cities...");

	try {
		const placeholderState = await db.query.malaysianStates.findFirst({
			where: eq(malaysianStates.name, "placeholder"),
		});

		if (placeholderState) {
			await db.insert(malaysianCities).values({
				name: "placeholder",
				stateId: placeholderState.id,
			});
			console.log("✅ Placeholder city seeded");
		}

		const states = await db.select().from(malaysianStates);

		for (const state of states) {
			if (state.name === "placeholder") continue;

			// special handling for Labuan and Putrajaya
			if (state.name === "Labuan") {
				await db.insert(malaysianCities).values({
					name: "Labuan",
					stateId: state.id,
				});
				console.log(`✅ Cities seeded for ${state.name}`);
				continue;
			}

			if (state.name === "Putrajaya") {
				await db.insert(malaysianCities).values({
					name: "Putrajaya",
					stateId: state.id,
				});
				console.log(`✅ Cities seeded for ${state.name}`);
				continue;
			}

			// for other states, fetch from API
			const stateNameForApi = state.name.toLowerCase().replace(/\s+/g, "_");

			const response = await fetch(
				`${process.env.MALAYSIA_API_BASE_URL}/state/v1/${stateNameForApi}.json`,
			);
			const data = await response.json();

			if (data.administrative_districts) {
				const cities = data.administrative_districts.map((city: string) => ({
					name: city,
					stateId: state.id,
				}));

				await db.insert(malaysianCities).values(cities);
				console.log(`✅ Cities seeded for ${state.name}`);
			}
		}

		console.log("✅ All Malaysian cities seeded successfully");
	} catch (error) {
		console.error("❌ Error seeding Malaysian cities:", error);
		throw error;
	}
}
