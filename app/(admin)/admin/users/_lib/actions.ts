"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/users";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getAuthClient } from "./client";

export type UserRole = "user" | "admin";

export async function setUserRole(userId: string, role: UserRole) {
	const authClient = getAuthClient();
	try {
		// Get current session to check if user is trying to remove their own admin role
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return { success: false, error: "Unauthorized" };
		}

		// If changing to 'user' role, check if this would remove the last admin
		if (role === "user") {
			// Count total admin users
			const adminCount = await db
				.select({ count: users.id })
				.from(users)
				.where(eq(users.role, "admin"));

			// If there's only 1 admin and the current user is trying to remove their own admin role
			if (adminCount.length === 1 && session.user.id === userId) {
				return {
					success: false,
					error:
						"Cannot remove admin role from yourself as you are the last admin user",
				};
			}
		}

		const result = await authClient.admin.setRole({
			userId,
			role,
		});
		if (result.error) throw result.error;
		revalidatePath("/admin/users");
		return { success: true };
	} catch (error) {
		console.error("Failed to set user role:", error);
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		return { success: false, error: errorMessage };
	}
}

export async function removeAdminRole(userId: string) {
	const authClient = getAuthClient();
	try {
		// Get current session to check if user is trying to remove their own admin role
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return { success: false, error: "Unauthorized" };
		}

		// Count total admin users
		const adminCount = await db
			.select({ count: users.id })
			.from(users)
			.where(eq(users.role, "admin"));

		// If there's only 1 admin and the current user is trying to remove their own admin role
		if (adminCount.length === 1 && session.user.id === userId) {
			return {
				success: false,
				error:
					"Cannot remove admin role from yourself as you are the last admin user",
			};
		}

		// Setting role back to 'user' to remove admin privileges
		const result = await authClient.admin.setRole({
			userId,
			role: "user",
		});
		if (result.error) throw result.error;
		revalidatePath("/admin/users");
		return { success: true };
	} catch (error) {
		console.error("Failed to remove admin role:", error);
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		return { success: false, error: errorMessage };
	}
}
