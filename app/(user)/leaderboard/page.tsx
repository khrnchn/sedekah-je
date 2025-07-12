import { UserLayout } from "@/components/user-layout";
import { StatsGrid } from "@/components/user-page-components";
import { Suspense } from "react";
import { AsyncLeaderboardStats } from "./_components/async-leaderboard-stats";
import { AsyncTopContributors } from "./_components/async-top-contributors";
import { TopContributorsSkeleton } from "./_components/loading-skeletons";

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
				<Suspense fallback={<TopContributorsSkeleton />}>
					<AsyncTopContributors />
				</Suspense>
			</div>
		</UserLayout>
	);
}
