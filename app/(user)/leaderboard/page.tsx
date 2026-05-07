import type { Metadata } from "next";
import { Suspense } from "react";
import { UserLayout } from "@/components/layout/user-layout";
import { StatsGrid } from "@/components/layout/user-page-components";
import { AsyncLeaderboardStats } from "./_components/async-leaderboard-stats";
import { AsyncTopContributors } from "./_components/async-top-contributors";
import { AsyncYourRank } from "./_components/async-your-rank";
import { TopContributorsSkeleton } from "./_components/loading-skeletons";

export const metadata: Metadata = {
	title: "Carta Penghantar QR",
	description:
		"Lihat pengguna paling aktif menghantar QR institusi ke sedekah.je. Carta ini berdasarkan QR yang diluluskan, bukan jumlah wang sedekah.",
	openGraph: {
		title: "Carta Penghantar QR | Sedekah Je",
		description:
			"Lihat pengguna paling aktif menghantar QR institusi ke sedekah.je. Carta ini berdasarkan QR yang diluluskan, bukan jumlah wang sedekah.",
		url: "https://sedekah.je/leaderboard",
	},
	twitter: {
		title: "Carta Penghantar QR | Sedekah Je",
		description:
			"Lihat pengguna paling aktif menghantar QR institusi ke sedekah.je. Carta ini berdasarkan QR yang diluluskan, bukan jumlah wang sedekah.",
	},
	alternates: {
		canonical: "https://sedekah.je/leaderboard",
	},
};

export default function LeaderboardPage() {
	return (
		<UserLayout
			title="Carta Penghantar QR"
			description="Kedudukan komuniti berdasarkan QR institusi yang dihantar dan diluluskan. Ini bukan carta jumlah wang sedekah."
		>
			<div className="space-y-8">
				<Suspense fallback={<StatsGrid cols={4} loading={true} />}>
					<AsyncLeaderboardStats />
				</Suspense>
				<Suspense fallback={null}>
					<AsyncYourRank />
				</Suspense>
				<Suspense fallback={<TopContributorsSkeleton />}>
					<AsyncTopContributors />
				</Suspense>
			</div>
		</UserLayout>
	);
}
