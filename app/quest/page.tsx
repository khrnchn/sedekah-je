import QuestPageClient from "./_components/quest-page-client";
import {
	getQuestLeaderboard,
	getQuestMosques,
	getQuestStats,
} from "./_lib/queries";

export const metadata = {
	title: "Mosque Quest | Sedekah.je",
	description: "Terokai masjid di daerah Petaling dan sumbang QR code mereka.",
};

export default async function QuestPage() {
	const [mosques, stats, leaderboard] = await Promise.all([
		getQuestMosques(),
		getQuestStats(),
		getQuestLeaderboard(),
	]);

	return (
		<QuestPageClient
			mosques={mosques}
			stats={stats}
			leaderboard={leaderboard}
		/>
	);
}
