"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { count, eq } from "drizzle-orm";
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
 * Get admin users count for display in sidebar badges
 */
export const getAdminUsersCount = unstable_cache(
	async () => {
		try {
			const result = await db
				.select({ count: count() })
				.from(users)
				.where(eq(users.role, "admin"));
			return result[0]?.count || 0;
		} catch (error) {
			console.error("Error fetching admin users count:", error);
			return 0;
		}
	},
	["admin-users-count"],
	{
		tags: ["users-count", "admin-users"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Get active users count for display in sidebar badges
 */
export const getActiveUsersCount = unstable_cache(
	async () => {
		try {
			const result = await db
				.select({ count: count() })
				.from(users)
				.where(eq(users.isActive, true));
			return result[0]?.count || 0;
		} catch (error) {
			console.error("Error fetching active users count:", error);
			return 0;
		}
	},
	["active-users-count"],
	{
		tags: ["users-count", "active-users"],
		revalidate: 300, // 5 minutes fallback
	},
);
