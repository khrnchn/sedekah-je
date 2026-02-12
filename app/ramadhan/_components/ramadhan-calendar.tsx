"use client";

import { getRamadhanDate } from "@/lib/ramadhan";
import type { RamadhanCampaignDay } from "../_lib/queries";
import { RamadhanDayCard } from "./ramadhan-day-card";

type RamadhanCalendarProps = {
	year: number;
	startDate: string;
	campaignByDay: Map<number, RamadhanCampaignDay>;
	todayDayNumber: number | null;
	todayDateStr: string;
	baseUrl: string;
};

export function RamadhanCalendar({
	startDate,
	campaignByDay,
	todayDateStr,
	baseUrl,
}: RamadhanCalendarProps) {
	const start = new Date(`${startDate}T12:00:00`);
	const days = Array.from({ length: 30 }, (_, i) => {
		const dayNumber = i + 1;
		const date = getRamadhanDate(start, dayNumber);
		const featuredDate = date.toISOString().slice(0, 10);
		const day = campaignByDay.get(dayNumber) ?? null;
		const isToday = todayDateStr === featuredDate;
		const isPast = todayDateStr > featuredDate;
		return (
			<RamadhanDayCard
				key={dayNumber}
				day={day}
				dayNumber={dayNumber}
				featuredDate={featuredDate}
				isToday={isToday}
				isPast={isPast}
				baseUrl={baseUrl}
			/>
		);
	});

	return (
		<div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">{days}</div>
	);
}
