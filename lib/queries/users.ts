"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { count } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Get total users count for display in sidebar badges
 */
export const getTotalUsersCount = unstable_cache(
	async () => {
		try {
			const result = await db.select({ count: count() }).from(users);
			return result[0]?.count || 0;
		} catch (error) {
			console.error("Error fetching total users count:", error);
			return 0;
		}
	},
	["total-users-count"],
	{
		tags: ["users-count", "total-users"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Get a user by their ID, cached for performance.
 * Specifically for admin role verification.
 * @param userId - The ID of the user to fetch.
 */
export const getAdminUser = (userId: string) =>
	unstable_cache(
		async () => {
			try {
				const user = await db.query.users.findFirst({
					where: eq(users.id, userId),
				});
				return user || null;
			} catch (error) {
				console.error("Error fetching admin user:", error);
				return null;
			}
		},
		[`admin-user-${userId}`],
		{
			tags: [`user-role-${userId}`],
			revalidate: 300,
		},
	)();

/**
 * Get a user by their ID, cached for performance.
 * @param userId - The ID of the user to fetch.
 */
export const getUserById = (userId: string) =>
	unstable_cache(
		async () => {
			try {
				const user = await db.query.users.findFirst({
					where: eq(users.id, userId),
				});
				return user || null;
			} catch (error) {
				console.error("Error fetching user:", error);
				return null;
			}
		},
		[`user-${userId}`],
		{
			tags: [`user-${userId}`],
			revalidate: 300, // 5 minutes
		},
	)();
