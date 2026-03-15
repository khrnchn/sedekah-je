import { Award, Star, Trophy, Users } from "lucide-react";
import { StatCard, StatsGrid } from "@/components/layout/user-page-components";
import { getLeaderboardStats } from "../_lib/queries";

export async function AsyncLeaderboardStats() {
	const stats = await getLeaderboardStats();

	return (
		<div data-tour="leaderboard-stats">
			<StatsGrid cols={4}>
				<StatCard
					icon={Users}
					value={stats.totalContributors}
					label="Penyumbang"
				/>
				<StatCard
					icon={Star}
					value={stats.totalContributions}
					label="Sumbangan"
				/>
				<StatCard
					icon={Trophy}
					value={stats.mostActiveContributions}
					label="Paling Aktif"
				/>
				<StatCard
					icon={Award}
					value={`${stats.approvalRate}%`}
					label="Kadar Lulus"
				/>
			</StatsGrid>
		</div>
	);
}
