import type { Metadata } from "next";
import { Suspense } from "react";
import { UserLayout } from "@/components/layout/user-layout";
import { AsyncContributionList } from "./_components/async-contribution-list";
import { AsyncStatsCards } from "./_components/async-stats-cards";
import {
	ContributionListSkeleton,
	StatsCardsSkeleton,
} from "./_components/loading-skeletons";

export const metadata: Metadata = {
	title: "Submission Saya",
	description:
		"Jejak dan urus submission anda kepada komuniti sedekah.je. Lihat status kelulusan institusi yang anda tambah dan statistik submission anda.",
	openGraph: {
		title: "Submission Saya | Sedekah Je",
		description:
			"Jejak dan urus submission anda kepada komuniti sedekah.je. Lihat status kelulusan institusi yang anda tambah dan statistik submission anda.",
		url: "https://sedekah.je/my-contributions",
	},
	twitter: {
		title: "Submission Saya | Sedekah Je",
		description:
			"Jejak dan urus submission anda kepada komuniti sedekah.je. Lihat status kelulusan institusi yang anda tambah dan statistik submission anda.",
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
			title="Submission Saya"
			description="Jejak dan urus submission anda kepada komuniti sedekah.je"
		>
			<div className="space-y-5 md:space-y-8">
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
