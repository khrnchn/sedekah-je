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

			// Get top contributors
			const topContributorsResult = await db
				.select({
					contributorId: institutions.contributorId,
					contributionCount: count().as("contributionCount"),
				})
				.from(institutions)
				.where(eq(institutions.isActive, true))
				.groupBy(institutions.contributorId)
				.orderBy(desc(count()))
				.limit(5);

			// Get user details for each contributor
			const topContributors = await Promise.all(
				topContributorsResult.map(async (result, index) => {
					if (!result.contributorId) {
						return {
							rank: index + 1,
							name: "Anonymous",
							contributions: Number(result.contributionCount),
							avatar: null,
						};
					}

					const user = await db
						.select({
							name: users.name,
							avatar: users.avatarUrl,
						})
						.from(users)
						.where(eq(users.id, result.contributorId))
						.limit(1);

					return {
						rank: index + 1,
						name: user[0]?.name ?? "Anonymous",
						contributions: Number(result.contributionCount),
						avatar: user[0]?.avatar ?? null,
					};
				}),
			);

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
