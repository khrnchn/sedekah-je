import type { Metadata } from "next";
import QuestPageClient from "./_components/quest-page-client";
import { getQuestLeaderboard, getQuestMosques } from "./_lib/queries";
import type { QuestStats } from "./_lib/types";

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
	const [mosques, leaderboard] = await Promise.all([
		getQuestMosques(),
		getQuestLeaderboard(),
	]);

	const stats: QuestStats = {
		total: mosques.length,
		hasQr: mosques.filter((m) => m.status === "has_qr").length,
		inReview: mosques.filter((m) => m.status === "in_review").length,
		missing: mosques.filter((m) => m.status === "missing").length,
		unmapped: mosques.filter((m) => m.coords === null).length,
	};

	return (
		<QuestPageClient
			mosques={mosques}
			stats={stats}
			leaderboard={leaderboard}
		/>
	);
}
