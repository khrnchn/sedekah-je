import { getContributionStats } from "@/app/(user)/my-contributions/_lib/queries";
import { StatsCards } from "./stats-cards";

export async function AsyncStatsCards() {
	const userStats = await getContributionStats();
	const stats = userStats ?? {
		totalContributions: 0,
		approvedContributions: 0,
		pendingContributions: 0,
		rejectedContributions: 0,
	};

	return <StatsCards stats={stats} />;
}
