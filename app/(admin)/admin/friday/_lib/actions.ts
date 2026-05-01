"use server";

import { and, asc, eq, ilike, notInArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
	fridayCampaignFavourites,
	fridayCampaignSettings,
	institutions,
} from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";

export type FridayInstitutionSearchResult = {
	id: number;
	name: string;
	slug: string;
	category: string;
	state: string;
};

async function assertApprovedInstitution(institutionId: number) {
	const [institution] = await db
		.select({ id: institutions.id })
		.from(institutions)
		.where(
			and(
				eq(institutions.id, institutionId),
				eq(institutions.status, "approved"),
			),
		)
		.limit(1);

	if (!institution) {
		throw new Error("Institution not found or not approved.");
	}
}

function revalidateFridayCampaign() {
	revalidatePath("/");
	revalidatePath("/admin/friday");
}

export async function setFridayOverride(institutionId: number | null) {
	const { session } = await requireAdminSession();

	if (institutionId !== null) {
		await assertApprovedInstitution(institutionId);
	}

	await db
		.insert(fridayCampaignSettings)
		.values({
			id: 1,
			activeOverrideInstitutionId: institutionId,
			updatedBy: session.user.id,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: fridayCampaignSettings.id,
			set: {
				activeOverrideInstitutionId: institutionId,
				updatedBy: session.user.id,
				updatedAt: new Date(),
			},
		});

	revalidateFridayCampaign();
	return { success: true };
}

export async function searchApprovedInstitutionsForFridayCampaign(
	query: string,
	excludeIds: number[] = [],
) {
	await requireAdminSession();

	const trimmed = query.trim();
	const conditions = [eq(institutions.status, "approved")];

	if (trimmed) {
		const pattern = `%${trimmed}%`;
		const searchCondition = or(
			ilike(institutions.name, pattern),
			ilike(institutions.slug, pattern),
			ilike(institutions.state, pattern),
			ilike(institutions.category, pattern),
		);
		if (searchCondition) conditions.push(searchCondition);
	}

	if (excludeIds.length > 0) {
		conditions.push(notInArray(institutions.id, excludeIds));
	}

	return db
		.select({
			id: institutions.id,
			name: institutions.name,
			slug: institutions.slug,
			category: institutions.category,
			state: institutions.state,
		})
		.from(institutions)
		.where(and(...conditions))
		.orderBy(asc(institutions.name), asc(institutions.id))
		.limit(30);
}

export async function addFridayFavourite(institutionId: number) {
	const { session } = await requireAdminSession();
	await assertApprovedInstitution(institutionId);

	await db
		.insert(fridayCampaignFavourites)
		.values({
			institutionId,
			createdBy: session.user.id,
		})
		.onConflictDoNothing({
			target: fridayCampaignFavourites.institutionId,
		});

	revalidateFridayCampaign();
	return { success: true };
}

export async function removeFridayFavourite(favouriteId: number) {
	await requireAdminSession();

	await db
		.delete(fridayCampaignFavourites)
		.where(eq(fridayCampaignFavourites.id, favouriteId));

	revalidateFridayCampaign();
	return { success: true };
}
