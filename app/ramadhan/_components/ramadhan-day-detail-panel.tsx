"use client";

import Share from "@/components/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import { formatDateBM } from "@/lib/ramadhan";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { RamadhanCampaignDay } from "../_lib/queries";

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
	const customMessage = `QR Hari ke-${dayNumber}/30 Ramadan! 🌙\n\n${day.institutionName} (${day.institutionState})\n\n${baseUrl}/${day.institutionCategory}/${day.institutionSlug}\n\n#SedekahJe #30Hari30QR`;

	return (
		<Card className="mt-4 border-2 border-primary/20 bg-accent/20">
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
						<div
							className={cn(
								"flex-shrink-0 flex items-center justify-center",
								"w-[120px] h-[120px] rounded-lg border border-border bg-background p-1",
							)}
						>
							{day.qrContent ? (
								<QrCodeDisplay
									qrContent={day.qrContent}
									supportedPayment={
										(day.supportedPayment ?? undefined) as
											| ("duitnow" | "tng" | "boost")[]
											| undefined
									}
									size={110}
								/>
							) : day.qrImage ? (
								<Image
									src={day.qrImage}
									alt={`QR ${day.institutionName}`}
									width={110}
									height={110}
									className="rounded object-contain"
								/>
							) : null}
						</div>
					</div>
					{day.caption && (
						<p className="text-sm text-muted-foreground">{day.caption}</p>
					)}
					<div className="flex flex-wrap gap-2">
						<Button asChild size="default">
							<Link href={`/${day.institutionCategory}/${day.institutionSlug}`}>
								Lihat institusi & derma
							</Link>
						</Button>
						<Share
							data={{
								category: day.institutionCategory,
								name: day.institutionName,
								slug: day.institutionSlug,
								customMessage,
							}}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
