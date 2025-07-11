"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Helper function to get authenticated user with proper role verification
 */
export async function getAuthenticatedUser() {
	const session = await auth.api.getSession({
		headers: await import("next/headers").then((mod) => mod.headers()),
	});

	if (!session?.user?.id) {
		throw new Error("Not authenticated");
	}

	// Get user from database to verify role server-side
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user.length) {
		throw new Error("User not found");
	}

	return {
		session,
		user: user[0],
	};
}

/**
 * Helper function to verify admin access
 */
export async function verifyAdminAccess() {
	const { user } = await getAuthenticatedUser();

	if (user.role !== "admin") {
		throw new Error("Admin access required");
	}

	return { user };
}
