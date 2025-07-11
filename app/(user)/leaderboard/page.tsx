import { UserLayout } from "@/components/user-layout";
import { LazyLeaderboardContent } from "./_components/lazy-leaderboard-content";

export default function LeaderboardPage() {
	return (
		<UserLayout
			title="Papan Pendahulu"
			description="Lihat penyumbang teratas dalam komuniti sedekah.je"
		>
			<LazyLeaderboardContent />
		</UserLayout>
	);
}
