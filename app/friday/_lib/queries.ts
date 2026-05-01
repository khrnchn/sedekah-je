"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
	fridayCampaignRuns,
	fridayCampaignSettings,
	institutions,
} from "@/db/schema";
import { getFridayCampaignDateStringMYT } from "@/lib/friday-campaign";

export type FridayCampaignFeature = {
	id: number;
	featuredDate: string;
	institutionId: number;
	source: "random" | "override";
	institutionName: string;
	institutionSlug: string;
	institutionCategory: string;
	institutionState: string;
	institutionCity: string;
	qrImage: string | null;
	qrContent: string | null;
	supportedPayment: string[] | null;
};

const institutionFields = {
	institutionName: institutions.name,
	institutionSlug: institutions.slug,
	institutionCategory: institutions.category,
	institutionState: institutions.state,
	institutionCity: institutions.city,
	qrImage: institutions.qrImage,
	qrContent: institutions.qrContent,
	supportedPayment: institutions.supportedPayment,
};

function toDateForDb(dateStr: string) {
	return new Date(`${dateStr}T12:00:00`);
}

function normalizeFeature(row: {
	id: number;
	featuredDate: string | Date;
	institutionId: number;
	source: "random" | "override";
	institutionName: string;
	institutionSlug: string;
	institutionCategory: string;
	institutionState: string;
	institutionCity: string;
	qrImage: string | null;
	qrContent: string | null;
	supportedPayment: unknown;
}): FridayCampaignFeature {
	return {
		...row,
		featuredDate:
			typeof row.featuredDate === "string"
				? row.featuredDate
				: row.featuredDate.toISOString().slice(0, 10),
		supportedPayment: row.supportedPayment as string[] | null,
	};
}

async function getRunByDate(dateStr: string) {
	const [row] = await db
		.select({
			id: fridayCampaignRuns.id,
			featuredDate: fridayCampaignRuns.featuredDate,
			institutionId: fridayCampaignRuns.institutionId,
			source: fridayCampaignRuns.source,
			...institutionFields,
		})
		.from(fridayCampaignRuns)
		.innerJoin(
			institutions,
			eq(fridayCampaignRuns.institutionId, institutions.id),
		)
		.where(eq(fridayCampaignRuns.featuredDate, toDateForDb(dateStr)))
		.limit(1);

	return row ? normalizeFeature(row) : null;
}

export async function getCurrentFridayCampaign() {
	const dateStr = getFridayCampaignDateStringMYT();
	if (!dateStr) return null;

	const [settings] = await db
		.select({
			activeOverrideInstitutionId:
				fridayCampaignSettings.activeOverrideInstitutionId,
			updatedBy: fridayCampaignSettings.updatedBy,
		})
		.from(fridayCampaignSettings)
		.where(eq(fridayCampaignSettings.id, 1))
		.limit(1);

	if (settings?.activeOverrideInstitutionId) {
		await db
			.insert(fridayCampaignRuns)
			.values({
				featuredDate: toDateForDb(dateStr),
				institutionId: settings.activeOverrideInstitutionId,
				source: "override",
				selectedBy: settings.updatedBy,
			})
			.onConflictDoUpdate({
				target: fridayCampaignRuns.featuredDate,
				set: {
					institutionId: settings.activeOverrideInstitutionId,
					source: "override",
					selectedBy: settings.updatedBy,
					updatedAt: new Date(),
				},
			});

		return getRunByDate(dateStr);
	}

	const existingRun = await getRunByDate(dateStr);
	if (existingRun) return existingRun;

	const [randomInstitution] = await db
		.select({
			institutionId: institutions.id,
		})
		.from(institutions)
		.where(eq(institutions.status, "approved"))
		.orderBy(sql`RANDOM()`)
		.limit(1);

	if (!randomInstitution) return null;

	await db
		.insert(fridayCampaignRuns)
		.values({
			featuredDate: toDateForDb(dateStr),
			institutionId: randomInstitution.institutionId,
			source: "random",
		})
		.onConflictDoNothing({
			target: fridayCampaignRuns.featuredDate,
		});

	return getRunByDate(dateStr);
}
