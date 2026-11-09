import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QuestPageClient from "@/app/quest/_components/quest-page-client";
import { getQuestLeaderboard, getQuestMosques } from "@/app/quest/_lib/queries";
import type { QuestStats } from "@/app/quest/_lib/types";
import { parseQuestParams } from "@/app/quest/_lib/url-state";
import { db } from "@/db";
import { questMosques } from "@/db/schema";
import { districtByName, districtBySlug } from "@/lib/features/quest/districts";

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

	const m = typeof query.m === "string" ? query.m : undefined;
	const { view, selectedId } = parseQuestParams(
		{ view: typeof query.view === "string" ? query.view : undefined, m },
		new Set(mosques.map((mosque) => mosque.id)),
	);

	// quest_mosques.id is a Postgres integer.
	if (m && selectedId === null && /^\d+$/.test(m) && Number(m) <= 2147483647) {
		const [row] = await db
			.select({ district: questMosques.district })
			.from(questMosques)
			.where(eq(questMosques.id, Number(m)))
			.limit(1);
		const owner = row ? districtByName(row.district) : null;
		if (owner && owner.slug !== district.slug) {
			const carry = new URLSearchParams();
			for (const [key, value] of Object.entries(query)) {
				if (typeof value === "string") carry.set(key, value);
			}
			redirect(`/quest/${owner.slug}?${carry.toString()}`);
		}
	}

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
