import type { Metadata } from "next";
import QuestPageClient from "./_components/quest-page-client";
import {
	getQuestLeaderboard,
	getQuestMosques,
	getQuestStats,
} from "./_lib/queries";

export const metadata: Metadata = {
	title: "Mosque Quest",
	description: "Terokai masjid di daerah Petaling dan sumbang QR code mereka.",
	openGraph: {
		title: "Mosque Quest | Sedekah Je",
		description:
			"Terokai masjid di daerah Petaling dan sumbang QR code mereka.",
		url: "https://sedekah.je/quest",
	},
	twitter: {
		title: "Mosque Quest | Sedekah Je",
		description:
			"Terokai masjid di daerah Petaling dan sumbang QR code mereka.",
	},
	alternates: {
		canonical: "https://sedekah.je/quest",
	},
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
