"use server";

import { asc, eq } from "drizzle-orm";
import { getCurrentFridayCampaign } from "@/app/friday/_lib/queries";
import { db } from "@/db";
import {
	fridayCampaignFavourites,
	fridayCampaignSettings,
	institutions,
} from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";

export type FridayFavouriteRow = {
	id: number;
	institutionId: number;
	institutionName: string;
	institutionSlug: string;
	institutionCategory: string;
	institutionState: string;
};

export type FridayInstitutionOption = {
	id: number;
	name: string;
	slug: string;
	category: string;
	state: string;
};

export async function getFridayCampaignForAdmin() {
	await requireAdminSession();

	const [settings, favourites, currentCampaign] = await Promise.all([
		db
			.select({
				activeOverrideInstitutionId:
					fridayCampaignSettings.activeOverrideInstitutionId,
				activeOverrideInstitutionName: institutions.name,
				activeOverrideInstitutionSlug: institutions.slug,
				activeOverrideInstitutionCategory: institutions.category,
				activeOverrideInstitutionState: institutions.state,
			})
			.from(fridayCampaignSettings)
			.leftJoin(
				institutions,
				eq(fridayCampaignSettings.activeOverrideInstitutionId, institutions.id),
			)
			.where(eq(fridayCampaignSettings.id, 1))
			.limit(1),
		db
			.select({
				id: fridayCampaignFavourites.id,
				institutionId: fridayCampaignFavourites.institutionId,
				institutionName: institutions.name,
				institutionSlug: institutions.slug,
				institutionCategory: institutions.category,
				institutionState: institutions.state,
			})
			.from(fridayCampaignFavourites)
			.innerJoin(
				institutions,
				eq(fridayCampaignFavourites.institutionId, institutions.id),
			)
			.orderBy(asc(fridayCampaignFavourites.sortOrder), asc(institutions.name)),
		getCurrentFridayCampaign(),
	]);

	const activeOverrideInstitution =
		settings[0]?.activeOverrideInstitutionId &&
		settings[0].activeOverrideInstitutionName &&
		settings[0].activeOverrideInstitutionSlug &&
		settings[0].activeOverrideInstitutionCategory &&
		settings[0].activeOverrideInstitutionState
			? {
					id: settings[0].activeOverrideInstitutionId,
					name: settings[0].activeOverrideInstitutionName,
					slug: settings[0].activeOverrideInstitutionSlug,
					category: settings[0].activeOverrideInstitutionCategory,
					state: settings[0].activeOverrideInstitutionState,
				}
			: null;

	return {
		activeOverrideInstitutionId:
			settings[0]?.activeOverrideInstitutionId ?? null,
		activeOverrideInstitution,
		favourites: favourites as FridayFavouriteRow[],
		currentCampaign,
	};
}
