"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { states } from "@/lib/institution-constants";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Get all dashboard data in a single optimized query to reduce connection usage
 */
export async function getDashboardData() {
	const [
		dashboardStats,
		categoryData,
		stateData,
		recentSubmissions,
		topContributors,
		latestActivities,
		institutionsWithCoords,
		monthlyGrowth,
	] = await Promise.all([
		getDashboardStats(),
		getInstitutionsByCategory(),
		getInstitutionsByState(),
		getRecentSubmissions(),
		getTopContributors(),
		getLatestActivities(),
		getInstitutionsWithCoords(),
		getMonthlyGrowth(),
	]);

	// Get state distribution for the map
	const completeStateData = await getStateDistribution();

	return {
		stats: dashboardStats,
		categoryData,
		stateData: completeStateData, // Use complete state distribution for consistency
		recentSubmissions,
		topContributors,
		latestActivities,
		institutionsWithCoords,
		monthlyGrowth,
	};
}

/**
 * Get dashboard statistics with counts for each institution status
 */
export const getDashboardStats = unstable_cache(
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
		revalidate: 900,
		tags: ["dashboard-data"],
	},
);

/**
 * Get institution statistics by category
 */
export const getInstitutionsByCategory = unstable_cache(
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
		revalidate: 900,
		tags: ["dashboard-data"],
	},
);

/**
 * Get institution statistics by state
 */
export const getInstitutionsByState = unstable_cache(
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
		revalidate: 900,
		tags: ["dashboard-data"],
	},
);

/**
 * Get recent institution submissions (last 30 days)
 */
export const getRecentSubmissions = unstable_cache(
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

/**
 * Get top contributors by number of submissions
 */
export const getTopContributors = unstable_cache(
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
		revalidate: 900,
		tags: ["dashboard-data"],
	},
);

/**
 * Get latest institution activities for the feed
 */
export async function getLatestActivities() {
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
}

/**
 * Get state distribution data for the map visualization
 */
export async function getStateDistribution() {
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
}

/**
 * Get monthly growth data for charts
 */
export async function getMonthlyGrowth() {
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
}

/**
 * Get institutions with their coordinates for map display
 */
export async function getInstitutionsWithCoords() {
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
}
