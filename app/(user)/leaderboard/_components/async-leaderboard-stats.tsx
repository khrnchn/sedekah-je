import { Award, Star, Trophy, Users } from "lucide-react";
import { StatsGrid } from "@/components/layout/user-page-components";
import { AnimatedStatCard } from "@/components/ui/animated-stat-card";
import { getLeaderboardStats } from "../_lib/queries";

export async function AsyncLeaderboardStats() {
	const stats = await getLeaderboardStats();

	return (
		<div data-tour="leaderboard-stats">
			<StatsGrid cols={4}>
				<AnimatedStatCard
					icon={Users}
					value={stats.totalContributors}
					label="Penyumbang"
				/>
				<AnimatedStatCard
					icon={Star}
					value={stats.totalContributions}
					label="Sumbangan"
				/>
				<AnimatedStatCard
					icon={Trophy}
					value={stats.mostActiveContributions}
					label="Paling Aktif"
				/>
				<AnimatedStatCard
					icon={Award}
					value={stats.approvalRate}
					suffix="%"
					label="Kadar Lulus"
				/>
			</StatsGrid>
		</div>
	);
}
