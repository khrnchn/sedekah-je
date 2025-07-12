import { UserLayout } from "@/components/user-layout";
import { Suspense } from "react";
import { AsyncContributionList } from "./_components/async-contribution-list";
import { AsyncStatsCards } from "./_components/async-stats-cards";
import {
	ContributionListSkeleton,
	StatsCardsSkeleton,
} from "./_components/loading-skeletons";

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
