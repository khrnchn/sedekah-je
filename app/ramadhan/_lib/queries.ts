"use server";

import { db } from "@/db";
import { institutions, ramadhanCampaigns } from "@/db/schema";
import { getTodayMYT, toDateString } from "@/lib/ramadhan";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export type RamadhanCampaignDay = {
	id: number;
	year: number;
	dayNumber: number;
	featuredDate: string;
	institutionId: number;
	caption: string | null;
	curatedBy: string | null;
	institutionName: string;
	institutionSlug: string;
	institutionCategory: string;
	institutionState: string;
	institutionCity: string;
	qrImage: string | null;
	qrContent: string | null;
	supportedPayment: string[] | null;
};

export async function getCampaignByYear(year: number) {
	return getCampaignByYearInternal(year);
}

function getCampaignByYearInternal(year: number) {
	return unstable_cache(
		async () => {
			const rows = await db
				.select({
					id: ramadhanCampaigns.id,
					year: ramadhanCampaigns.year,
					dayNumber: ramadhanCampaigns.dayNumber,
					featuredDate: ramadhanCampaigns.featuredDate,
					institutionId: ramadhanCampaigns.institutionId,
					caption: ramadhanCampaigns.caption,
					curatedBy: ramadhanCampaigns.curatedBy,
					institutionName: institutions.name,
					institutionSlug: institutions.slug,
					institutionCategory: institutions.category,
					institutionState: institutions.state,
					institutionCity: institutions.city,
					qrImage: institutions.qrImage,
					qrContent: institutions.qrContent,
					supportedPayment: institutions.supportedPayment,
				})
				.from(ramadhanCampaigns)
				.innerJoin(
					institutions,
					eq(ramadhanCampaigns.institutionId, institutions.id),
				)
				.where(eq(ramadhanCampaigns.year, year))
				.orderBy(ramadhanCampaigns.dayNumber);

			return rows.map((r) => ({
				...r,
				featuredDate:
					typeof r.featuredDate === "string"
						? r.featuredDate
						: toDateString(r.featuredDate as Date),
				supportedPayment: r.supportedPayment as string[] | null,
			})) as RamadhanCampaignDay[];
		},
		[`ramadhan-campaign-${year}`],
		{
			revalidate: 900,
			tags: ["ramadhan-campaign"],
		},
	)();
}

const getTodaysFeaturedInternal = (dateStr: string) =>
	unstable_cache(
		async () => {
			const [row] = await db
				.select({
					id: ramadhanCampaigns.id,
					year: ramadhanCampaigns.year,
					dayNumber: ramadhanCampaigns.dayNumber,
					featuredDate: ramadhanCampaigns.featuredDate,
					institutionId: ramadhanCampaigns.institutionId,
					caption: ramadhanCampaigns.caption,
					curatedBy: ramadhanCampaigns.curatedBy,
					institutionName: institutions.name,
					institutionSlug: institutions.slug,
					institutionCategory: institutions.category,
					institutionState: institutions.state,
					institutionCity: institutions.city,
					qrImage: institutions.qrImage,
					qrContent: institutions.qrContent,
					supportedPayment: institutions.supportedPayment,
				})
				.from(ramadhanCampaigns)
				.innerJoin(
					institutions,
					eq(ramadhanCampaigns.institutionId, institutions.id),
				)
				.where(
					eq(ramadhanCampaigns.featuredDate, new Date(`${dateStr}T12:00:00`)),
				)
				.limit(1);

			if (!row) return null;

			return {
				...row,
				featuredDate:
					typeof row.featuredDate === "string"
						? row.featuredDate
						: toDateString(row.featuredDate as Date),
				supportedPayment: row.supportedPayment as string[] | null,
			} as RamadhanCampaignDay;
		},
		[`ramadhan-today-${dateStr}`],
		{
			revalidate: 300,
			tags: ["ramadhan-campaign"],
		},
	)();

export async function getTodaysFeatured() {
	const dateStr = toDateString(getTodayMYT());
	return getTodaysFeaturedInternal(dateStr);
}
