"use client";

import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { getRamadhanDate } from "@/lib/ramadhan";
import { useCallback, useState } from "react";
import type { RamadhanCampaignDay } from "../_lib/queries";
import { DETAIL_PANEL_ID, RamadhanDayCard } from "./ramadhan-day-card";
import { RamadhanDayDetailPanel } from "./ramadhan-day-detail-panel";
import { RamadhanDayDetailPlaceholder } from "./ramadhan-day-detail-placeholder";

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
	const isMobile = useIsMobile();
	const [selectedDay, setSelectedDay] = useState<number | null>(null);

	const handleSelect = useCallback((dayNumber: number) => {
		setSelectedDay((prev) => (prev === dayNumber ? null : dayNumber));
	}, []);

	const handleSheetOpenChange = useCallback((open: boolean) => {
		if (!open) setSelectedDay(null);
	}, []);

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
				isSelected={selectedDay === dayNumber}
				onSelect={handleSelect}
			/>
		);
	});

	const selectedDayData = selectedDay ? campaignByDay.get(selectedDay) : null;

	const detailContent =
		selectedDayData && selectedDay !== null ? (
			<RamadhanDayDetailPanel
				day={selectedDayData}
				dayNumber={selectedDay}
				baseUrl={baseUrl}
			/>
		) : null;

	const panelContent = detailContent ?? <RamadhanDayDetailPlaceholder />;

	return (
		<>
			<div className="lg:grid lg:grid-cols-[1fr_minmax(280px,360px)] lg:gap-6">
				<div>
					<p className="text-sm text-muted-foreground mb-3">
						Pilih hari untuk lihat QR & butiran
					</p>
					<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
						{days}
					</div>
					{/* Below lg, when not mobile: show panel or placeholder below grid */}
					{!isMobile && (
						<section
							id={DETAIL_PANEL_ID}
							aria-label={
								detailContent
									? "Butiran institusi terpilih"
									: "Pilih hari untuk lihat butiran"
							}
							className="mt-6 lg:hidden"
						>
							{panelContent}
						</section>
					)}
				</div>
				{/* Desktop sticky panel - visible only at lg, always show panel or placeholder */}
				<aside className="hidden lg:block">
					<div className="sticky top-4">
						<section
							id={DETAIL_PANEL_ID}
							aria-label={
								detailContent
									? "Butiran institusi terpilih"
									: "Pilih hari untuk lihat butiran"
							}
						>
							{panelContent}
						</section>
					</div>
				</aside>
			</div>

			{/* Mobile bottom sheet - only mount when mobile to avoid duplicate IDs */}
			{isMobile && (
				<Sheet open={selectedDay !== null} onOpenChange={handleSheetOpenChange}>
					<SheetContent
						side="bottom"
						className="max-h-[85vh] overflow-y-auto rounded-t-xl px-6 pb-8"
					>
						<SheetTitle className="sr-only">
							Butiran institusi terpilih
						</SheetTitle>
						<SheetDescription className="sr-only">
							Pilih hari dari kalendar untuk lihat QR kod dan butiran institusi.
						</SheetDescription>
						<div id={DETAIL_PANEL_ID}>{detailContent}</div>
					</SheetContent>
				</Sheet>
			)}
		</>
	);
}
