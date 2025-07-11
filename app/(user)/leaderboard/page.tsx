import { UserLayout } from "@/components/user-layout";
import { LazyLeaderboardContent } from "./_components/lazy-leaderboard-content";

export default function LeaderboardPage() {
	return (
		<UserLayout
			title="Leaderboard"
			description="See the top contributors in the sedekah.je community"
		>
			<LazyLeaderboardContent />
		</UserLayout>
	);
}
