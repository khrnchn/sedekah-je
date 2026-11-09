import type { Metadata } from "next";
import QuestPageClient from "./_components/quest-page-client";
import { getQuestLeaderboard, getQuestMosques } from "./_lib/queries";
import type { QuestStats } from "./_lib/types";
import { parseQuestParams } from "./_lib/url-state";

const DESCRIPTION =
	"Find the missing donation QR codes for mosques in Petaling.";

export const metadata: Metadata = {
	title: "Mosque Quest",
	description: DESCRIPTION,
	openGraph: {
		title: "Mosque Quest | Sedekah Je",
		description: DESCRIPTION,
		url: "https://sedekah.je/quest",
	},
	twitter: {
		title: "Mosque Quest | Sedekah Je",
		description: DESCRIPTION,
	},
	alternates: {
		canonical: "https://sedekah.je/quest",
	},
};

export default async function QuestPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const [params, mosques, leaderboard] = await Promise.all([
		searchParams,
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

	const { view, selectedId } = parseQuestParams(
		{
			view: typeof params.view === "string" ? params.view : undefined,
			m: typeof params.m === "string" ? params.m : undefined,
		},
		new Set(mosques.map((m) => m.id)),
	);

	return (
		<QuestPageClient
			mosques={mosques}
			stats={stats}
			leaderboard={leaderboard}
			initialView={view}
			initialSelectedId={selectedId}
		/>
	);
}
