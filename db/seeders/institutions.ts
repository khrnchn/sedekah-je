import { institutions as data } from "@/app/data/institutions";
import { eq } from "drizzle-orm";
import type { PoolClient } from "pg";
import { db } from "..";
import {
	type NewInstitution,
	categories,
	institutionPaymentMethods,
	institutions,
	malaysianCities,
	malaysianStates,
	paymentMethods,
} from "../schema";

// expected shape
interface InstitutionData {
	name: string;
	category: string;
	state: string;
	city: string;
	qrImage?: string;
	qrContent?: string;
	coords: [number, number];
	supportedPayment?: string[];
}

export const seedInstitutions = async (client: PoolClient) => {
	try {
		console.log("🌱 Seeding institutions...");

		for (const d of data as InstitutionData[]) {
			console.log(`Processing institution: ${d.name}`);

			let categoryId: number;
			const name = d.name.toLowerCase();

			// category
			if (name.includes("kebajikan")) {
				const category = await db.query.categories.findFirst({
					where: eq(categories.name, "welfare"),
				});
				categoryId = category?.id ?? 6; // fallback to placeholder category
			} else if (name.includes("maahad") || name.includes("tahfiz")) {
				const category = await db.query.categories.findFirst({
					where: eq(categories.name, "maahad"),
				});
				categoryId = category?.id ?? 6;
			} else {
				const category = await db.query.categories.findFirst({
					where: eq(categories.name, d.category),
				});
				categoryId = category?.id ?? 6;
			}

			// state
			let stateId: number;
			const state = await db.query.malaysianStates.findFirst({
				where: eq(malaysianStates.name, d.state),
			});
			if (!state) {
				console.warn(
					`State not found: ${d.state}, using placeholder state for institution ${d.name}`,
				);
				const placeholderState = await db.query.malaysianStates.findFirst({
					where: eq(malaysianStates.name, "placeholder"),
				});
				stateId = placeholderState!.id;
			} else {
				stateId = state.id;
			}

			// city
			let cityId: number;
			const city = await db.query.malaysianCities.findFirst({
				where: eq(malaysianCities.name, d.city),
			});
			if (!city) {
				console.warn(
					`City not found: ${d.city}, using placeholder city for institution ${d.name}`,
				);
				const placeholderCity = await db.query.malaysianCities.findFirst({
					where: eq(malaysianCities.name, "placeholder"),
				});
				cityId = placeholderCity!.id;
			} else {
				cityId = city.id;
			}

			const institutionData: NewInstitution = {
				name: d.name,
				categoryId,
				stateId,
				cityId,
				qrImagePath: d.qrImage || null,
				qrContent: d.qrContent || null,
				latitude: d.coords?.[0]?.toString() ?? "0",
				longitude: d.coords?.[1]?.toString() ?? "0",
				contributorId: 1,
				status: "pending",
			};

			// insert institution
			const [institution] = await db
				.insert(institutions)
				.values(institutionData)
				.returning({ id: institutions.id });

			// supported payment methods
			if (d.supportedPayment) {
				for (const method of d.supportedPayment) {
					const paymentMethod = await db.query.paymentMethods.findFirst({
						where: eq(paymentMethods.name, method),
					});
					if (!paymentMethod) continue;

					await db.insert(institutionPaymentMethods).values({
						institutionId: institution.id,
						paymentMethodId: paymentMethod.id,
					});
				}
			}
		}

		console.log("✅ Institutions seeding completed");
	} catch (error) {
		console.error("Error seeding institutions:", error);
		throw error;
	}
};
