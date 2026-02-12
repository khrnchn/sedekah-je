"use client";

import { Card } from "@/components/ui/card";
import { formatDateBM } from "@/lib/ramadhan";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { RamadhanCampaignDay } from "../_lib/queries";

type RamadhanDayCardProps = {
	day: RamadhanCampaignDay | null;
	dayNumber: number;
	featuredDate: string;
	isToday: boolean;
	isPast: boolean;
	isSelected: boolean;
	onSelect: (dayNumber: number) => void;
};

const DETAIL_PANEL_ID = "ramadhan-day-detail";

export function RamadhanDayCard({
	day,
	dayNumber,
	featuredDate,
	isToday,
	isPast,
	isSelected,
	onSelect,
}: RamadhanDayCardProps) {
	if (!day) {
		return (
			<Card
				className={cn(
					"p-3 min-h-[120px] flex flex-col justify-center",
					"bg-muted/50",
				)}
				aria-hidden="true"
			>
				<div className="text-center">
					<p className="font-semibold text-muted-foreground">
						Hari {dayNumber}
					</p>
					<p className="text-xs text-muted-foreground">
						{formatDateBM(featuredDate)}
					</p>
					<p className="text-sm text-muted-foreground mt-1">Belum diisi</p>
				</div>
			</Card>
		);
	}

	const formattedDate = formatDateBM(featuredDate);
	const label = `Hari ${dayNumber}, ${day.institutionName}, ${formattedDate}. ${isSelected ? "Dipilih. Klik untuk tutup." : "Klik untuk lihat QR kod."}`;

	return (
		<Card
			className={cn(
				"min-h-[120px] overflow-hidden transition-shadow duration-200",
				"focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
				isSelected && "ring-2 ring-primary ring-offset-2 shadow-md",
				isToday &&
					!isSelected &&
					"ring-2 ring-emerald-500 ring-offset-2 animate-pulse-subtle",
			)}
		>
			<button
				type="button"
				className={cn(
					"w-full text-left p-3 flex items-start gap-2 rounded-lg",
					"hover:bg-accent/50 hover:shadow-sm",
					"focus:outline-none focus-visible:ring-0",
					isPast && !isSelected && "hover:bg-muted/50",
				)}
				onClick={() => onSelect(dayNumber)}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onSelect(dayNumber);
					}
				}}
				aria-expanded={isSelected}
				aria-controls={DETAIL_PANEL_ID}
				aria-label={label}
			>
				<div className="min-w-0 flex-1">
					<p className="font-semibold text-sm">Hari {dayNumber}</p>
					<p className="text-xs text-muted-foreground">{formattedDate}</p>
					<p
						className="text-sm font-medium line-clamp-2"
						title={day.institutionName}
					>
						{day.institutionName}
					</p>
				</div>
				<ChevronRight
					className={cn(
						"h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200",
						isSelected && "rotate-90",
					)}
					aria-hidden
				/>
			</button>
		</Card>
	);
}

export { DETAIL_PANEL_ID };
