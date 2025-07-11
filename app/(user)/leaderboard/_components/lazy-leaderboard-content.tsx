import { MobileProgressiveLoader } from "@/components/progressive-loader";
import { StatsGrid } from "@/components/user-page-components";
import { Suspense } from "react";
import { LeaderboardContent } from "./leaderboard-content";
import { TopContributorsSkeleton } from "./loading-skeletons";

export function LazyLeaderboardContent() {
	return (
		<MobileProgressiveLoader
			fallback={
				<div className="space-y-8">
					<StatsGrid cols={4} loading={true} />
					<TopContributorsSkeleton />
				</div>
			}
			threshold={0.1}
		>
			<Suspense
				fallback={
					<div className="space-y-8">
						<StatsGrid cols={4} loading={true} />
						<TopContributorsSkeleton />
					</div>
				}
			>
				<LeaderboardContent />
			</Suspense>
		</MobileProgressiveLoader>
	);
}
