"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryIconPath } from "../_lib/category-icon";
import type { RamadhanCampaignDay } from "../_lib/queries";
import { buildRamadhanShareMessage } from "../_lib/share-message";
import { RamadhanCampaignCtaRow } from "./ramadhan-campaign-cta-row";
import { RamadhanQrMedia } from "./ramadhan-qr-media";

type RamadhanTodayCardProps = {
	featured: RamadhanCampaignDay;
	baseUrl: string;
};

export function RamadhanTodayCard({
	featured,
	baseUrl,
}: RamadhanTodayCardProps) {
	const institutionUrl = `${baseUrl}/${featured.institutionCategory}/${featured.institutionSlug}`;
	const customMessage = buildRamadhanShareMessage({
		headline: `QR Hari Ini — Hari ke-${featured.dayNumber}/30 Ramadan`,
		institutionName: featured.institutionName,
		institutionState: featured.institutionState,
		url: institutionUrl,
	});

	return (
		<Card className="relative overflow-hidden border-primary/15 bg-primary/5">
			<div className="absolute inset-0 opacity-12 ramadhan-bg" />
			<CardContent className="relative p-6 flex flex-col sm:flex-row gap-6">
				<div className="flex-1 space-y-4">
					<div>
						<p className="text-sm font-medium text-primary">
							QR Hari Ini — Hari ke-{featured.dayNumber}/30
						</p>
						<h2 className="text-2xl font-bold text-foreground">
							{featured.institutionName}
						</h2>
						<p className="text-sm text-muted-foreground">
							{featured.institutionCity}, {featured.institutionState}
						</p>
						<div className="flex items-center gap-2 mt-2">
							<Image
								src={getCategoryIconPath(featured.institutionCategory)}
								alt=""
								width={28}
								height={28}
							/>
							<span className="text-sm capitalize text-muted-foreground">
								{featured.institutionCategory.replace("-", " ")}
							</span>
						</div>
					</div>
					{featured.caption && (
						<p className="text-sm text-muted-foreground">{featured.caption}</p>
					)}
					<RamadhanCampaignCtaRow
						institutionCategory={featured.institutionCategory}
						institutionSlug={featured.institutionSlug}
						institutionName={featured.institutionName}
						customMessage={customMessage}
					/>
				</div>
				<div className="flex-shrink-0 flex justify-center">
					<RamadhanQrMedia
						day={featured}
						size={200}
						imageClassName="rounded-lg bg-white p-2"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
