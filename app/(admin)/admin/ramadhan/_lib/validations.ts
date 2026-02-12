import { getRamadhanDate } from "@/lib/ramadhan";
import { z } from "zod";

export const campaignDaySchema = z.object({
	dayNumber: z.number().min(1).max(30),
	institutionId: z.number().nullable(),
	caption: z.string().max(500).nullable(),
});

export const saveCampaignSchema = z.object({
	year: z.number().min(2020).max(2050),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
	days: z.array(campaignDaySchema).length(30),
});

export type SaveCampaignInput = z.infer<typeof saveCampaignSchema>;

export function computeFeaturedDate(
	startDateStr: string,
	dayNumber: number,
): string {
	const startDate = new Date(`${startDateStr}T12:00:00`);
	const date = getRamadhanDate(startDate, dayNumber);
	return date.toISOString().slice(0, 10);
}
