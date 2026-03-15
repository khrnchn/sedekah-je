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
		"Lihat penyumbang teratas dalam komuniti sedekah.je. Papan pendahulu menunjukkan ahli yang paling aktif menyumbang institusi ke platform.",
	openGraph: {
		title: "Papan Pendahulu | Sedekah Je",
		description:
			"Lihat penyumbang teratas dalam komuniti sedekah.je. Papan pendahulu menunjukkan ahli yang paling aktif menyumbang institusi ke platform.",
		url: "https://sedekah.je/leaderboard",
	},
	twitter: {
		title: "Papan Pendahulu | Sedekah Je",
		description:
			"Lihat penyumbang teratas dalam komuniti sedekah.je. Papan pendahulu menunjukkan ahli yang paling aktif menyumbang institusi ke platform.",
	},
	alternates: {
		canonical: "https://sedekah.je/leaderboard",
	},
};

export default function LeaderboardPage() {
	return (
		<UserLayout
			title="Papan Pendahulu"
			description="Lihat penyumbang teratas dalam komuniti sedekah.je"
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
