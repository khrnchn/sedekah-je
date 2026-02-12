"use client";

import Share from "@/components/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getCategoryIconPath } from "../_lib/category-icon";
import type { RamadhanCampaignDay } from "../_lib/queries";

type RamadhanDayCardProps = {
	day: RamadhanCampaignDay | null;
	dayNumber: number;
	featuredDate: string;
	isToday: boolean;
	isPast: boolean;
	baseUrl: string;
};

export function RamadhanDayCard({
	day,
	dayNumber,
	featuredDate,
	isToday,
	isPast,
	baseUrl,
}: RamadhanDayCardProps) {
	const [expanded, setExpanded] = useState(false);

	if (!day) {
		return (
			<Card
				className={cn(
					"p-3 min-h-[100px] flex flex-col justify-center",
					"bg-muted/30 opacity-60",
				)}
			>
				<div className="text-center">
					<p className="font-semibold text-muted-foreground">
						Hari {dayNumber}
					</p>
					<p className="text-xs text-muted-foreground">{featuredDate}</p>
					<p className="text-xs text-muted-foreground mt-1">—</p>
				</div>
			</Card>
		);
	}

	const customMessage = `QR Hari ke-${dayNumber}/30 Ramadan! 🌙\n\n${day.institutionName} (${day.institutionState})\n\n${baseUrl}/${day.institutionCategory}/${day.institutionSlug}\n\n#SedekahJe #30Hari30QR`;

	return (
		<Card
			className={cn(
				"p-3 min-h-[100px] cursor-pointer transition-all",
				isToday && "ring-2 ring-emerald-500 ring-offset-2 animate-pulse-subtle",
				isPast && "hover:bg-muted/50",
			)}
			onClick={() => day && setExpanded(!expanded)}
		>
			<CardContent className="p-0">
				<div className="flex items-start gap-2">
					<Image
						src={getCategoryIconPath(day.institutionCategory)}
						alt=""
						width={24}
						height={24}
						className="flex-shrink-0 mt-0.5"
					/>
					<div className="min-w-0 flex-1">
						<p className="font-semibold text-sm">Hari {dayNumber}</p>
						<p className="text-xs text-muted-foreground">{featuredDate}</p>
						<p className="text-sm font-medium truncate">
							{day.institutionName}
						</p>
					</div>
				</div>
				{expanded && (
					// biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only, not actionable
					<div
						className="mt-4 pt-4 border-t space-y-4"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-center">
							{day.qrContent ? (
								<QrCodeDisplay
									qrContent={day.qrContent}
									supportedPayment={
										(day.supportedPayment ?? undefined) as
											| ("duitnow" | "tng" | "boost")[]
											| undefined
									}
									size={160}
								/>
							) : day.qrImage ? (
								<Image
									src={day.qrImage}
									alt={`QR ${day.institutionName}`}
									width={160}
									height={160}
									className="rounded-lg bg-white p-2"
								/>
							) : null}
						</div>
						{day.caption && (
							<p className="text-sm text-muted-foreground">{day.caption}</p>
						)}
						<div className="flex flex-wrap gap-2">
							<Share
								data={{
									category: day.institutionCategory,
									name: day.institutionName,
									slug: day.institutionSlug,
									customMessage,
								}}
								platform="X"
							/>
							<Share
								data={{
									category: day.institutionCategory,
									name: day.institutionName,
									slug: day.institutionSlug,
									customMessage,
								}}
								platform="WHATSAPP"
							/>
							<Button asChild variant="outline" size="sm">
								<Link
									href={`/${day.institutionCategory}/${day.institutionSlug}`}
								>
									Lihat institusi
								</Link>
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
