"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { INSTITUTION_STATUSES } from "@/lib/institution-constants";
import { and, count, countDistinct, desc, eq, not, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export interface LeaderboardStats {
	totalContributors: number;
	totalContributions: number;
	mostActiveContributions: number;
	verificationRate: number;
}

export interface TopContributor {
	rank: number;
	name: string;
	contributions: number;
	avatar: string | null;
}

export interface LeaderboardData {
	stats: LeaderboardStats;
	topContributors: TopContributor[];
}

export async function getLeaderboardStats(): Promise<LeaderboardStats> {
	return unstable_cache(
		async () => {
			const statsPromise = db
				.select({
					totalContributions: count(institutions.id),
					totalContributors: countDistinct(institutions.contributorId),
					verifiedCount: count(
						sql`case when ${institutions.isVerified} = true then 1 end`.mapWith(
							Number,
						),
					),
				})
				.from(institutions)
				.where(
					and(
						eq(institutions.isActive, true),
						eq(institutions.status, INSTITUTION_STATUSES.APPROVED),
					),
				);

			const mostActivePromise = db
				.select({
					contributionCount: count().as("contributionCount"),
				})
				.from(institutions)
				.where(
					and(
						eq(institutions.isActive, true),
						eq(institutions.status, INSTITUTION_STATUSES.APPROVED),
					),
				)
				.groupBy(institutions.contributorId)
				.orderBy(desc(count()))
				.limit(1);

			const [statsResult, mostActiveResult] = await Promise.all([
				statsPromise,
				mostActivePromise,
			]);

			const { totalContributions, totalContributors, verifiedCount } =
				statsResult[0];

			const mostActiveContributions =
				mostActiveResult[0]?.contributionCount ?? 0;

			const verificationRate =
				totalContributions > 0
					? Math.round((verifiedCount / totalContributions) * 100)
					: 0;

			return {
				totalContributors,
				totalContributions,
				mostActiveContributions,
				verificationRate,
			};
		},
		["leaderboard-stats"],
		{ revalidate: 300, tags: ["leaderboard", "leaderboard-stats"] },
	)();
}

export async function getTopContributors(): Promise<TopContributor[]> {
	return unstable_cache(
		async () => {
			const topContributorsResult = await db
				.select({
					contributorId: institutions.contributorId,
					contributionCount: count().as("contributionCount"),
					userName: users.name,
					userAvatar: users.avatarUrl,
				})
				.from(institutions)
				.leftJoin(users, eq(institutions.contributorId, users.id))
				.where(
					and(
						eq(institutions.isActive, true),
						eq(institutions.status, INSTITUTION_STATUSES.APPROVED),
						not(eq(users.role, "admin")),
					),
				)
				.groupBy(institutions.contributorId, users.name, users.avatarUrl)
				.orderBy(desc(count()))
				.limit(5);

			return topContributorsResult.map((result, index) => ({
				rank: index + 1,
				name: result.userName ?? "Anonymous",
				contributions: Number(result.contributionCount),
				avatar: result.userAvatar ?? null,
			}));
		},
		["leaderboard-top-contributors"],
		{ revalidate: 300, tags: ["leaderboard", "leaderboard-top-contributors"] },
	)();
}
