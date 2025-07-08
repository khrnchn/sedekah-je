"use server";

import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Fetch all institutions that are currently pending approval.
 * Joins contributor information when available for display purposes.
 */
export async function getPendingInstitutions() {
	return await db
		.select({
			id: institutions.id,
			name: institutions.name,
			category: institutions.category,
			state: institutions.state,
			city: institutions.city,
			contributorName: users.name,
			contributorId: users.id,
			createdAt: institutions.createdAt,
		})
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(eq(institutions.status, "pending"))
		.orderBy(institutions.createdAt);
}
