"use server";

import { db } from "@/db";
import { institutions, ramadhanCampaigns } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { getInstitutions } from "@/lib/queries/institutions";
import { eq } from "drizzle-orm";

export type AdminCampaignDay = {
	dayNumber: number;
	featuredDate: string;
	institutionId: number | null;
	institutionName: string | null;
	caption: string | null;
};

export async function getCampaignForAdmin(year: number) {
	await requireAdminSession();

	const rows = await db
		.select({
			dayNumber: ramadhanCampaigns.dayNumber,
			featuredDate: ramadhanCampaigns.featuredDate,
			institutionId: ramadhanCampaigns.institutionId,
			caption: ramadhanCampaigns.caption,
			institutionName: institutions.name,
		})
		.from(ramadhanCampaigns)
		.leftJoin(
			institutions,
			eq(ramadhanCampaigns.institutionId, institutions.id),
		)
		.where(eq(ramadhanCampaigns.year, year))
		.orderBy(ramadhanCampaigns.dayNumber);

	return rows.map((r) => ({
		dayNumber: r.dayNumber,
		featuredDate:
			typeof r.featuredDate === "string"
				? r.featuredDate
				: r.featuredDate.toISOString().slice(0, 10),
		institutionId: r.institutionId,
		institutionName: r.institutionName,
		caption: r.caption,
	})) as AdminCampaignDay[];
}

export async function getApprovedInstitutionsForPicker() {
	await requireAdminSession();
	const list = await getInstitutions();
	return list.map((i) => ({
		id: i.id,
		name: i.name,
		slug: i.slug,
		category: i.category,
		state: i.state,
	}));
}
