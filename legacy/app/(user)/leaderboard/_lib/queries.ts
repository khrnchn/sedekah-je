"use server";

import {
	and,
	count,
	countDistinct,
	desc,
	eq,
	inArray,
	isNotNull,
} from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { INSTITUTION_STATUSES } from "@/lib/institution-constants";

export interface LeaderboardStats {
	totalContributors: number;
	totalContributions: number;
	mostActiveContributions: number;
	approvalRate: number;
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
				})
				.from(institutions)
				.where(
					and(
						eq(institutions.isActive, true),
						eq(institutions.status, INSTITUTION_STATUSES.APPROVED),
					),
				);

			const workflowCountsPromise = db
				.select({
					status: institutions.status,
					count: count(institutions.id),
				})
				.from(institutions)
				.where(
					and(
						eq(institutions.isActive, true),
						inArray(institutions.status, [
							INSTITUTION_STATUSES.APPROVED,
							INSTITUTION_STATUSES.REJECTED,
						]),
					),
				)
				.groupBy(institutions.status);

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

			const [statsResult, workflowCountsResult, mostActiveResult] =
				await Promise.all([
					statsPromise,
					workflowCountsPromise,
					mostActivePromise,
				]);

			const { totalContributions, totalContributors } = statsResult[0];

			const approvedCount =
				workflowCountsResult.find(
					(r) => r.status === INSTITUTION_STATUSES.APPROVED,
				)?.count ?? 0;
			const rejectedCount =
				workflowCountsResult.find(
					(r) => r.status === INSTITUTION_STATUSES.REJECTED,
				)?.count ?? 0;
			const reviewedTotal = approvedCount + rejectedCount;
			const approvalRate =
				reviewedTotal > 0
					? Math.round((approvedCount / reviewedTotal) * 100)
					: 0;

			const mostActiveContributions =
				mostActiveResult[0]?.contributionCount ?? 0;

			return {
				totalContributors,
				totalContributions,
				mostActiveContributions,
				approvalRate,
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
						isNotNull(institutions.contributorId),
					),
				)
				.groupBy(institutions.contributorId, users.name, users.avatarUrl)
				.orderBy(desc(count()))
				.limit(20);

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

export interface UserLeaderboardRank {
	rank: number;
	contributions: number;
}

export async function getCurrentUserLeaderboardRank(
	userId: string,
): Promise<UserLeaderboardRank | null> {
	return unstable_cache(
		async () => {
			const ranked = await db
				.select({
					contributorId: institutions.contributorId,
					contributionCount: count().as("contributionCount"),
				})
				.from(institutions)
				.where(
					and(
						eq(institutions.isActive, true),
						eq(institutions.status, INSTITUTION_STATUSES.APPROVED),
						isNotNull(institutions.contributorId),
					),
				)
				.groupBy(institutions.contributorId)
				.orderBy(desc(count()));

			const userIndex = ranked.findIndex(
				(r) => r.contributorId && r.contributorId === userId,
			);
			if (userIndex === -1) return null;

			const row = ranked[userIndex];
			return {
				rank: userIndex + 1,
				contributions: Number(row.contributionCount),
			};
		},
		[`leaderboard-user-rank:${userId}`],
		{
			revalidate: 300,
			tags: ["leaderboard", `leaderboard-user-rank:${userId}`],
		},
	)();
}
