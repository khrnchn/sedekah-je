"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { states } from "@/lib/institution-constants";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Get dashboard statistics with counts for each institution status
 */
const getDashboardStatsInternal = unstable_cache(
	async () => {
		const [stats] = await db
			.select({
				total: count(),
				pending:
					sql<number>`COUNT(CASE WHEN ${institutions.status} = 'pending' THEN 1 END)`.mapWith(
						Number,
					),
				approved:
					sql<number>`COUNT(CASE WHEN ${institutions.status} = 'approved' THEN 1 END)`.mapWith(
						Number,
					),
				rejected:
					sql<number>`COUNT(CASE WHEN ${institutions.status} = 'rejected' THEN 1 END)`.mapWith(
						Number,
					),
			})
			.from(institutions);

		return stats;
	},
	["dashboard-stats"],
	{
		revalidate: 300, // 5 minutes for admin data
		tags: ["dashboard-data"],
	},
);

export async function getDashboardStats() {
	await requireAdminSession();
	return getDashboardStatsInternal();
}

/**
 * Get institution statistics by category
 */
const getInstitutionsByCategoryInternal = unstable_cache(
	async () => {
		const result = await db
			.select({
				category: institutions.category,
				count: count(),
			})
			.from(institutions)
			.where(eq(institutions.status, "approved"))
			.groupBy(institutions.category);

		return result;
	},
	["institutions-by-category"],
	{
		revalidate: 300, // 5 minutes for admin data
		tags: ["dashboard-data"],
	},
);

export async function getInstitutionsByCategory() {
	await requireAdminSession();
	return getInstitutionsByCategoryInternal();
}

/**
 * Get institution statistics by state
 */
const getInstitutionsByStateInternal = unstable_cache(
	async () => {
		const result = await db
			.select({
				state: institutions.state,
				count: count(),
			})
			.from(institutions)
			.where(eq(institutions.status, "approved"))
			.groupBy(institutions.state)
			.orderBy(sql`count DESC`);

		return result;
	},
	["institutions-by-state"],
	{
		revalidate: 300, // 5 minutes for admin data
		tags: ["dashboard-data"],
	},
);

export async function getInstitutionsByState() {
	await requireAdminSession();
	return getInstitutionsByStateInternal();
}

/**
 * Get recent institution submissions (last 30 days)
 */
const getRecentSubmissionsInternal = unstable_cache(
	async () => {
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		const result = await db
			.select({
				date: sql<string>`DATE(${institutions.createdAt})`,
				count: count(),
			})
			.from(institutions)
			.where(gte(institutions.createdAt, thirtyDaysAgo))
			.groupBy(sql`DATE(${institutions.createdAt})`)
			.orderBy(sql`DATE(${institutions.createdAt})`);

		return result;
	},
	["recent-submissions"],
	{
		revalidate: 300,
		tags: ["dashboard-data"],
	},
);

export async function getRecentSubmissions() {
	await requireAdminSession();
	return getRecentSubmissionsInternal();
}

/**
 * Get top contributors by number of submissions
 */
const getTopContributorsInternal = unstable_cache(
	async () => {
		const result = await db
			.select({
				contributorName: users.name,
				contributorEmail: users.email,
				submissionCount: count(),
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.status, "approved"))
			.groupBy(users.name, users.email)
			.orderBy(sql`count DESC`)
			.limit(5);

		return result;
	},
	["top-contributors"],
	{
		revalidate: 300, // 5 minutes for admin data
		tags: ["dashboard-data"],
	},
);

export async function getTopContributors() {
	await requireAdminSession();
	return getTopContributorsInternal();
}

/**
 * Get latest institution activities for the feed - cached for better performance
 */
const getLatestActivitiesInternal = unstable_cache(
	async () => {
		const result = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				status: institutions.status,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				contributorName: users.name,
				createdAt: institutions.createdAt,
				reviewedAt: institutions.reviewedAt,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.orderBy(sql`${institutions.createdAt} DESC`)
			.limit(10);

		return result;
	},
	["latest-activities"],
	{
		revalidate: 60, // 1 minute for recent activity
		tags: ["dashboard-data", "recent-activities"],
	},
);

export async function getLatestActivities() {
	await requireAdminSession();
	return getLatestActivitiesInternal();
}

/**
 * Get state distribution data for the map visualization - cached
 */
const getStateDistributionInternal = unstable_cache(
	async () => {
		const result = await db
			.select({
				state: institutions.state,
				count: count(),
			})
			.from(institutions)
			.where(eq(institutions.status, "approved"))
			.groupBy(institutions.state);

		// Create a complete state distribution with zero counts for states without institutions
		const stateDistribution = states.map((state) => {
			const found = result.find((r) => r.state === state);
			return {
				state,
				count: found ? found.count : 0,
			};
		});

		return stateDistribution;
	},
	["state-distribution"],
	{
		revalidate: 300, // 5 minutes
		tags: ["dashboard-data"],
	},
);

export async function getStateDistribution() {
	await requireAdminSession();
	return getStateDistributionInternal();
}

/**
 * Get monthly growth data for charts - cached
 */
const getMonthlyGrowthInternal = unstable_cache(
	async () => {
		const result = await db
			.select({
				month: sql<string>`TO_CHAR(${institutions.createdAt}, 'YYYY-MM')`,
				total: count(),
				pending: sql<number>`COUNT(CASE WHEN ${institutions.status} = 'pending' THEN 1 END)`,
				approved: sql<number>`COUNT(CASE WHEN ${institutions.status} = 'approved' THEN 1 END)`,
				rejected: sql<number>`COUNT(CASE WHEN ${institutions.status} = 'rejected' THEN 1 END)`,
			})
			.from(institutions)
			.groupBy(sql`TO_CHAR(${institutions.createdAt}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${institutions.createdAt}, 'YYYY-MM')`);

		return result;
	},
	["monthly-growth"],
	{
		revalidate: 300, // 5 minutes
		tags: ["dashboard-data"],
	},
);

export async function getMonthlyGrowth() {
	await requireAdminSession();
	return getMonthlyGrowthInternal();
}

/**
 * Get institutions with their coordinates for map display - cached
 */
const getInstitutionsWithCoordsInternal = unstable_cache(
	async () => {
		const result = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
				coords: institutions.coords,
			})
			.from(institutions)
			.where(
				and(
					eq(institutions.status, "approved"),
					sql`${institutions.coords} IS NOT NULL`,
				),
			);

		return result;
	},
	["institutions-with-coords"],
	{
		revalidate: 300, // 5 minutes
		tags: ["dashboard-data"],
	},
);

export async function getInstitutionsWithCoords() {
	await requireAdminSession();
	return getInstitutionsWithCoordsInternal();
}
