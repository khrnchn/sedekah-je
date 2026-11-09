import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuestPageClient from "@/app/quest/_components/quest-page-client";
import { getQuestLeaderboard, getQuestMosques } from "@/app/quest/_lib/queries";
import type { QuestStats } from "@/app/quest/_lib/types";
import { parseQuestParams } from "@/app/quest/_lib/url-state";
import { districtBySlug } from "@/lib/features/quest/districts";

type Params = Promise<{ district: string }>;

export async function generateMetadata({
	params,
}: {
	params: Params;
}): Promise<Metadata> {
	const district = districtBySlug((await params).district);
	if (!district) return {};
	const title = `Mosque Quest: ${district.name}`;
	const description = `Find the missing donation QR codes for mosques in ${district.name}, Selangor.`;
	const url = `https://sedekah.je/quest/${district.slug}`;
	return {
		title,
		description,
		openGraph: { title: `${title} | Sedekah Je`, description, url },
		twitter: { title: `${title} | Sedekah Je`, description },
		alternates: { canonical: url },
	};
}

export default async function QuestDistrictPage({
	params,
	searchParams,
}: {
	params: Params;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const district = districtBySlug((await params).district);
	if (!district) notFound();

	const [query, mosques, leaderboard] = await Promise.all([
		searchParams,
		getQuestMosques(district.name),
		getQuestLeaderboard(district.name),
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
			view: typeof query.view === "string" ? query.view : undefined,
			m: typeof query.m === "string" ? query.m : undefined,
		},
		new Set(mosques.map((m) => m.id)),
	);

	return (
		<QuestPageClient
			district={district}
			mosques={mosques}
			stats={stats}
			leaderboard={leaderboard}
			initialView={view}
			initialSelectedId={selectedId}
		/>
	);
}
