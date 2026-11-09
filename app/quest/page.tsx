import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { questMosques } from "@/db/schema";
import {
	districtByName,
	QUEST_DISTRICTS,
} from "@/lib/features/quest/districts";
import QuestOverview from "./_components/quest-overview";
import { getQuestDistrictStats, getQuestLeaderboard } from "./_lib/queries";
import { questPath, VIEWS } from "./_lib/url-state";

const DESCRIPTION =
	"Find the missing donation QR codes for mosques across Selangor.";

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
	const params = await searchParams;

	// Links from before districts existed: /quest?m={id}&view=...
	const m = typeof params.m === "string" ? params.m : "";
	// quest_mosques.id is a Postgres integer.
	if (/^\d+$/.test(m) && Number(m) <= 2147483647) {
		const [row] = await db
			.select({ district: questMosques.district })
			.from(questMosques)
			.where(eq(questMosques.id, Number(m)))
			.limit(1);
		const district = row ? districtByName(row.district) : null;
		if (district) {
			const view = VIEWS.find((v) => v === params.view) ?? "map";
			redirect(questPath(district.slug, view, Number(m)));
		}
	}

	const [stats, leaderboard] = await Promise.all([
		getQuestDistrictStats(),
		getQuestLeaderboard(null),
	]);

	const districts = QUEST_DISTRICTS.map((d) => {
		const s = stats.find((row) => row.district === d.name);
		return {
			...d,
			total: s?.total ?? 0,
			hasQr: s?.hasQr ?? 0,
			inReview: s?.inReview ?? 0,
		};
	});

	return <QuestOverview districts={districts} leaderboard={leaderboard} />;
}
