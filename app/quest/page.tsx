import QuestPageClient from "./_components/quest-page-client";
import { getQuestMosques, getQuestStats } from "./_lib/queries";

export const metadata = {
	title: "Mosque Quest | Sedekah.je",
	description: "Terokai masjid di daerah Petaling dan sumbang QR code mereka.",
};

export default async function QuestPage() {
	const [mosques, stats] = await Promise.all([
		getQuestMosques(),
		getQuestStats(),
	]);

	return <QuestPageClient mosques={mosques} stats={stats} />;
}
