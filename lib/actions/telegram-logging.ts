"use server";

import { auth } from "@/auth";
import { logNewUser } from "@/lib/telegram";
import { headers } from "next/headers";

export async function checkAndLogNewUser(): Promise<void> {
	try {
		const session = await auth.api.getSession({ headers: headers() });

		if (!session?.user) {
			return;
		}

		// Check if this is a newly created user by looking at creation time
		const userCreatedAt = new Date(session.user.createdAt);
		const now = new Date();
		const timeDiff = now.getTime() - userCreatedAt.getTime();
		const minutesDiff = timeDiff / (1000 * 60);

		// If user was created within the last 5 minutes, consider it a new user
		if (minutesDiff <= 5) {
			await logNewUser({
				id: session.user.id,
				name: session.user.name || "Unknown",
				email: session.user.email,
				role: session.user.role || "user",
			});
		}
	} catch (error) {
		console.error("Failed to check and log new user:", error);
	}
}
