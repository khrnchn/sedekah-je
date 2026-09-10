import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";

export class AdminAuthError extends Error {}

export async function requireAdminSession() {
	const hdrs = await headers();
	const session = await auth.api.getSession({ headers: hdrs });

	if (!session) {
		throw new AdminAuthError("Unauthorized: Admin access required");
	}

	// Verify role via database to avoid relying on session payload alone
	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user || user.role !== "admin") {
		throw new AdminAuthError("Unauthorized: Admin access required");
	}

	return { session, user };
}

// For Route Handlers, which must return a Response rather than throw.
export async function requireAdminApiSession() {
	try {
		const { session, user } = await requireAdminSession();
		return { ok: true as const, session, user };
	} catch (error) {
		if (error instanceof AdminAuthError) {
			return {
				ok: false as const,
				response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
			};
		}
		throw error;
	}
}
