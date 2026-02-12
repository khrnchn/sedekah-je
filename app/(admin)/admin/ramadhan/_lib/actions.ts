"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { ramadhanCampaigns } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import {
	type SaveCampaignInput,
	computeFeaturedDate,
	saveCampaignSchema,
} from "./validations";

export async function saveCampaign(input: SaveCampaignInput) {
	const { session } = await requireAdminSession();
	const curatedBy = session.user.id;

	const parsed = saveCampaignSchema.safeParse(input);
	if (!parsed.success) {
		throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
	}

	const { year, startDate, days } = parsed.data;

	// Filter to rows with institution assigned
	const rowsToInsert = days
		.filter(
			(d): d is typeof d & { institutionId: number } => d.institutionId != null,
		)
		.map((d) => ({
			year,
			dayNumber: d.dayNumber,
			featuredDate: new Date(computeFeaturedDate(startDate, d.dayNumber)),
			institutionId: d.institutionId,
			caption: d.caption ?? null,
			curatedBy,
		}));

	await db.transaction(async (tx) => {
		await tx.delete(ramadhanCampaigns).where(eq(ramadhanCampaigns.year, year));

		if (rowsToInsert.length > 0) {
			await tx.insert(ramadhanCampaigns).values(rowsToInsert);
		}
	});

	revalidateTag("ramadhan-campaign");
	return { success: true };
}
