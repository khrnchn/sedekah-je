"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
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

export async function getLeaderboardData(): Promise<LeaderboardData> {
	return unstable_cache(
		async () => {
			// Get total number of unique contributors
			const contributorsResult = await db
				.select({
					contributorCount: count(institutions.contributorId).as(
						"contributorCount",
					),
				})
				.from(institutions)
				.where(eq(institutions.isActive, true))
				.groupBy(institutions.contributorId);

			const totalContributors = contributorsResult.length;

			// Get total number of active contributions
			const contributionsResult = await db
				.select({
					totalCount: count().as("totalCount"),
				})
				.from(institutions)
				.where(eq(institutions.isActive, true));

			const totalContributions = contributionsResult[0]?.totalCount ?? 0;

			// Get most active contributor's contribution count
			const mostActiveResult = await db
				.select({
					contributionCount: count().as("contributionCount"),
				})
				.from(institutions)
				.where(eq(institutions.isActive, true))
				.groupBy(institutions.contributorId)
				.orderBy(desc(count()))
				.limit(1);

			const mostActiveContributions =
				mostActiveResult[0]?.contributionCount ?? 0;

			// Get verification rate
			const verifiedResult = await db
				.select({
					verifiedCount: count().as("verifiedCount"),
				})
				.from(institutions)
				.where(
					and(
						eq(institutions.isActive, true),
						eq(institutions.isVerified, true),
					),
				);

			const verificationRate =
				totalContributions > 0
					? Math.round(
							((verifiedResult[0]?.verifiedCount ?? 0) / totalContributions) *
								100,
						)
					: 0;

			// Get top contributors with user details in single JOIN query
			const topContributorsResult = await db
				.select({
					contributorId: institutions.contributorId,
					contributionCount: count().as("contributionCount"),
					userName: users.name,
					userAvatar: users.avatarUrl,
				})
				.from(institutions)
				.leftJoin(users, eq(institutions.contributorId, users.id))
				.where(eq(institutions.isActive, true))
				.groupBy(institutions.contributorId, users.name, users.avatarUrl)
				.orderBy(desc(count()))
				.limit(5);

			// Map results with rank
			const topContributors = topContributorsResult.map((result, index) => ({
				rank: index + 1,
				name: result.userName ?? "Anonymous",
				contributions: Number(result.contributionCount),
				avatar: result.userAvatar ?? null,
			}));

			return {
				stats: {
					totalContributors,
					totalContributions,
					mostActiveContributions,
					verificationRate,
				},
				topContributors,
			};
		},
		["leaderboard"],
		{
			revalidate: 300,
			tags: ["leaderboard"],
		},
	)();
}
