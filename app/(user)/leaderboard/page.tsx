import type { Metadata } from "next";
import { Suspense } from "react";
import { UserLayout } from "@/components/layout/user-layout";
import { StatsGrid } from "@/components/layout/user-page-components";
import { AsyncLeaderboardStats } from "./_components/async-leaderboard-stats";
import { AsyncTopContributors } from "./_components/async-top-contributors";
import { AsyncYourRank } from "./_components/async-your-rank";
import { TopContributorsSkeleton } from "./_components/loading-skeletons";

export const metadata: Metadata = {
	title: "Papan Pendahulu",
	description:
		"Lihat pengguna paling aktif menghantar QR institusi ke sedekah.je. Papan pendahulu ini berdasarkan jumlah sumbangan QR, bukan jumlah wang yang didermakan.",
	openGraph: {
		title: "Papan Pendahulu | Sedekah Je",
		description:
			"Lihat pengguna paling aktif menghantar QR institusi ke sedekah.je. Papan pendahulu ini berdasarkan jumlah sumbangan QR, bukan jumlah wang yang didermakan.",
		url: "https://sedekah.je/leaderboard",
	},
	twitter: {
		title: "Papan Pendahulu | Sedekah Je",
		description:
			"Lihat pengguna paling aktif menghantar QR institusi ke sedekah.je. Papan pendahulu ini berdasarkan jumlah sumbangan QR, bukan jumlah wang yang didermakan.",
	},
	alternates: {
		canonical: "https://sedekah.je/leaderboard",
	},
};

export default function LeaderboardPage() {
	return (
		<UserLayout
			title="Papan Pendahulu"
			description="Kedudukan pengguna berdasarkan jumlah sumbangan QR institusi, bukan jumlah sumbangan wang"
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
