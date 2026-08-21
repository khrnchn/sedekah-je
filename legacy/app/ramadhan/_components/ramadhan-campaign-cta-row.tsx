"use client";

import Link from "next/link";
import Share from "@/components/share";
import { Button } from "@/components/ui/button";

type RamadhanCampaignCtaRowProps = {
	institutionCategory: string;
	institutionSlug: string;
	institutionName: string;
	customMessage: string;
	shareVariant?: "outline" | "secondary" | "ghost";
};

export function RamadhanCampaignCtaRow({
	institutionCategory,
	institutionSlug,
	institutionName,
	customMessage,
	shareVariant = "outline",
}: RamadhanCampaignCtaRowProps) {
	return (
		<div className="flex flex-wrap gap-2">
			<Button asChild size="default">
				<Link href={`/${institutionCategory}/${institutionSlug}`}>
					Lihat institusi & derma
				</Link>
			</Button>
			<Share
				data={{
					category: institutionCategory,
					name: institutionName,
					slug: institutionSlug,
					customMessage,
				}}
				variant={shareVariant}
			/>
		</div>
	);
}
