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
					label="Penghantar QR"
				/>
				<StatCard
					icon={Star}
					value={stats.totalContributions}
					label="QR Diluluskan"
				/>
				<StatCard
					icon={Trophy}
					value={stats.mostActiveContributions}
					label="Rekod Tertinggi"
				/>
				<StatCard
					icon={Award}
					value={`${stats.approvalRate}%`}
					label="Kadar Diluluskan"
				/>
			</StatsGrid>
		</div>
	);
}
