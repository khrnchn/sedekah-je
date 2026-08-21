"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatDateBM } from "@/lib/ramadhan";
import { cn } from "@/lib/utils";
import type { RamadhanCampaignDay } from "../_lib/queries";
import { buildRamadhanShareMessage } from "../_lib/share-message";
import { RamadhanCampaignCtaRow } from "./ramadhan-campaign-cta-row";
import { RamadhanQrMedia } from "./ramadhan-qr-media";

type RamadhanDayDetailPanelProps = {
	day: RamadhanCampaignDay;
	dayNumber: number;
	baseUrl: string;
};

export function RamadhanDayDetailPanel({
	day,
	dayNumber,
	baseUrl,
}: RamadhanDayDetailPanelProps) {
	const institutionUrl = `${baseUrl}/${day.institutionCategory}/${day.institutionSlug}`;
	const customMessage = buildRamadhanShareMessage({
		headline: `QR Hari ke-${dayNumber}/30 Ramadan`,
		institutionName: day.institutionName,
		institutionState: day.institutionState,
		url: institutionUrl,
	});

	return (
		<Card className="mt-4 border-primary/15 bg-primary/5">
			<CardContent className="p-6">
				<div className="space-y-4">
					<div className="flex items-start gap-4">
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-muted-foreground">
								Hari {dayNumber}/30 · {formatDateBM(day.featuredDate)}
							</p>
							<h3 className="text-lg font-bold mt-1">{day.institutionName}</h3>
							<p className="text-sm text-muted-foreground">
								{day.institutionCity}, {day.institutionState}
							</p>
						</div>
						<RamadhanQrMedia
							day={day}
							size={110}
							imageClassName="rounded object-contain"
							wrapperClassName={cn(
								"flex-shrink-0 flex items-center justify-center",
								"w-[120px] h-[120px] rounded-lg border border-border bg-background p-1",
							)}
						/>
					</div>
					{day.caption && (
						<p className="text-sm text-muted-foreground">{day.caption}</p>
					)}
					<RamadhanCampaignCtaRow
						institutionCategory={day.institutionCategory}
						institutionSlug={day.institutionSlug}
						institutionName={day.institutionName}
						customMessage={customMessage}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
