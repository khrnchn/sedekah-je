"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { headers } from "next/headers";

export interface MyContributionsStats {
	totalContributions: number;
	approvedContributions: number;
	pendingContributions: number;
	rejectedContributions: number;
}

export interface ContributionItem {
	id: string;
	name: string;
	status: "pending" | "approved" | "rejected";
	date: string; // ISO string
	type: string;
}

export interface MyContributionsResponse {
	stats: MyContributionsStats;
	contributions: ContributionItem[];
}

type FetchType = "all" | "stats" | "contributions";

export async function getMyContributions(
	fetchType: FetchType = "all",
): Promise<Partial<MyContributionsResponse> | null> {
	const hdrs = headers();
	const session = await auth.api.getSession({ headers: hdrs });

	if (!session) {
		return null;
	}

	const { id: userId } = session.user;

	return unstable_cache(
		async () => {
			let stats: MyContributionsStats | undefined;
			let contributions: ContributionItem[] | undefined;

			if (fetchType === "all" || fetchType === "stats") {
				const [statsResult] = await db
					.select({
						totalContributions: count(),
						approvedContributions: count(
							sql`CASE WHEN ${institutions.status} = 'approved' THEN 1 END`,
						),
						pendingContributions: count(
							sql`CASE WHEN ${institutions.status} = 'pending' THEN 1 END`,
						),
						rejectedContributions: count(
							sql`CASE WHEN ${institutions.status} = 'rejected' THEN 1 END`,
						),
					})
					.from(institutions)
					.where(eq(institutions.contributorId, userId));

				stats = {
					totalContributions: statsResult.totalContributions,
					approvedContributions: statsResult.approvedContributions,
					pendingContributions: statsResult.pendingContributions,
					rejectedContributions: statsResult.rejectedContributions,
				};
			}

			if (fetchType === "all" || fetchType === "contributions") {
				const results = await db
					.select({
						id: institutions.id,
						name: institutions.name,
						status: institutions.status,
						createdAt: institutions.createdAt,
						category: institutions.category,
					})
					.from(institutions)
					.where(eq(institutions.contributorId, userId))
					.orderBy(desc(institutions.createdAt));

				contributions = results.map((inst) => ({
					id: inst.id.toString(),
					name: inst.name,
					status: inst.status as ContributionItem["status"],
					date: inst.createdAt?.toISOString() ?? "",
					type: inst.category,
				}));
			}

			return { stats, contributions };
		},
		[`my-contributions:${userId}:${fetchType}`],
		{
			revalidate: 300,
			tags: [
				"user-contributions",
				`user-contributions:${userId}`,
				`user-contributions:${userId}:${fetchType}`,
			],
		},
	)();
}

export async function getContributionStats() {
	const data = await getMyContributions("stats");
	return data?.stats ?? null;
}

export async function getContributionList() {
	const data = await getMyContributions("contributions");
	return data?.contributions ?? [];
}
