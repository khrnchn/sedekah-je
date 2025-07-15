import { UserLayout } from "@/components/user-layout";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AsyncContributionList } from "./_components/async-contribution-list";
import { AsyncStatsCards } from "./_components/async-stats-cards";
import {
	ContributionListSkeleton,
	StatsCardsSkeleton,
} from "./_components/loading-skeletons";

export const metadata: Metadata = {
	title: "Sumbangan Saya",
	description:
		"Jejak dan urus sumbangan anda kepada komuniti sedekah.je. Lihat status kelulusan institusi yang anda tambah dan statistik sumbangan anda.",
	openGraph: {
		title: "Sumbangan Saya | Sedekah Je",
		description:
			"Jejak dan urus sumbangan anda kepada komuniti sedekah.je. Lihat status kelulusan institusi yang anda tambah dan statistik sumbangan anda.",
		url: "https://sedekah.je/my-contributions",
	},
	twitter: {
		title: "Sumbangan Saya | Sedekah Je",
		description:
			"Jejak dan urus sumbangan anda kepada komuniti sedekah.je. Lihat status kelulusan institusi yang anda tambah dan statistik sumbangan anda.",
	},
	alternates: {
		canonical: "https://sedekah.je/my-contributions",
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function MyContributionsPage() {
	return (
		<UserLayout
			title="Sumbangan Saya"
			description="Jejak dan urus sumbangan anda kepada komuniti sedekah.je"
		>
			<div className="space-y-8">
				<Suspense fallback={<StatsCardsSkeleton />}>
					<AsyncStatsCards />
				</Suspense>
				<Suspense fallback={<ContributionListSkeleton />}>
					<AsyncContributionList />
				</Suspense>
			</div>
		</UserLayout>
	);
}
