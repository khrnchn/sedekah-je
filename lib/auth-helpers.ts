import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function requireAdminSession() {
	const hdrs = headers();
	const session = await auth.api.getSession({ headers: hdrs });

	if (!session) {
		throw new Error("Unauthorized: Admin access required");
	}

	// Verify role via database to avoid relying on session payload alone
	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user || user.role !== "admin") {
		throw new Error("Unauthorized: Admin access required");
	}

	return { session, user };
}
