import { getMyContributions } from "@/app/(user)/my-contributions/_lib/queries";
import { UserLayout } from "@/components/user-layout";
import { LazyContributionList } from "./_components/lazy-contribution-list";
import { StatsCards } from "./_components/stats-cards";

export default async function MyContributionsPage() {
	const data = await getMyContributions();

	const userStats = data?.stats ?? {
		totalContributions: 0,
		approvedContributions: 0,
		pendingContributions: 0,
		rejectedContributions: 0,
	};

	const contributions = data?.contributions ?? [];

	return (
		<UserLayout
			title="Sumbangan Saya"
			description="Jejak dan urus sumbangan anda kepada komuniti sedekah.je"
		>
			<div className="space-y-8">
				<StatsCards stats={userStats} />
				<LazyContributionList contributions={contributions} />
			</div>
		</UserLayout>
	);
}
