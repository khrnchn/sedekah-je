"use client";

import Image from "next/image";
import Link from "next/link";
import type { PaymentOption } from "@/app/types/institutions";
import QrCodeDisplay from "@/components/institution/qr-code-display";
import Share from "@/components/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoryIconPath } from "../_lib/category-icon";
import type { RamadhanCampaignDay } from "../_lib/queries";

type RamadhanTodayCardProps = {
	featured: RamadhanCampaignDay;
	baseUrl: string;
};

export function RamadhanTodayCard({
	featured,
	baseUrl,
}: RamadhanTodayCardProps) {
	const institutionUrl = `${baseUrl}/${featured.institutionCategory}/${featured.institutionSlug}`;
	const customMessage = `QR Hari Ini — Hari ke-${featured.dayNumber}/30 Ramadan! 🌙\n\n${featured.institutionName} (${featured.institutionState})\n\n${institutionUrl}\n\n#SedekahJe #30Hari30QR`;

	return (
		<Card className="relative overflow-hidden border-primary/20 bg-primary/10">
			<div className="absolute inset-0 opacity-20 ramadhan-bg" />
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
					<div className="flex flex-wrap gap-2">
						<Button asChild size="default">
							<Link
								href={`/${featured.institutionCategory}/${featured.institutionSlug}`}
							>
								Lihat institusi & derma
							</Link>
						</Button>
						<Share
							data={{
								category: featured.institutionCategory,
								name: featured.institutionName,
								slug: featured.institutionSlug,
								customMessage,
							}}
							variant="outline"
						/>
					</div>
				</div>
				<div className="flex-shrink-0 flex justify-center">
					{featured.qrContent ? (
						<QrCodeDisplay
							qrContent={featured.qrContent}
							supportedPayment={
								(featured.supportedPayment ?? undefined) as
									| PaymentOption[]
									| undefined
							}
							size={200}
						/>
					) : featured.qrImage ? (
						<Image
							src={featured.qrImage}
							alt={`QR ${featured.institutionName}`}
							width={200}
							height={200}
							className="rounded-lg bg-white p-2"
						/>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
