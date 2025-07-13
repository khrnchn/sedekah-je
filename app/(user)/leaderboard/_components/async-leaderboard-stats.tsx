import { StatCard, StatsGrid } from "@/components/user-page-components";
import { Award, Star, Trophy, Users } from "lucide-react";
import { getLeaderboardStats } from "../_lib/queries";

export async function AsyncLeaderboardStats() {
	const stats = await getLeaderboardStats();

	return (
		<StatsGrid cols={4}>
			<StatCard
				icon={Users}
				value={stats.totalContributors}
				label="Contributors"
			/>
			<StatCard
				icon={Star}
				value={stats.totalContributions}
				label="Contributions"
			/>
			<StatCard
				icon={Trophy}
				value={stats.mostActiveContributions}
				label="Most Active"
			/>
			<StatCard
				icon={Award}
				value={`${stats.verificationRate}%`}
				label="Verified"
			/>
		</StatsGrid>
	);
}
