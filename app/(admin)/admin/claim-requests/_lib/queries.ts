import { db } from "@/db";
import { claimRequests, institutions, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { unstable_cache } from "@/lib/unstable-cache";
import { count, desc, eq } from "drizzle-orm";

const getPendingClaimRequestsCountInternal = unstable_cache(
	async () => {
		const result = await db
			.select({ count: count() })
			.from(claimRequests)
			.where(eq(claimRequests.status, "pending"));

		return result[0]?.count || 0;
	},
	["pending-claim-requests-count"],
	{
		revalidate: 60, // 1 minute
		tags: ["claim-requests", "claim-requests-count"],
	},
);

export async function getPendingClaimRequestsCount() {
	await requireAdminSession();
	return getPendingClaimRequestsCountInternal();
}

const getPendingClaimRequestsInternal = unstable_cache(
	async () => {
		return await db
			.select({
				id: claimRequests.id,
				institutionId: claimRequests.institutionId,
				institutionName: institutions.name,
				institutionCategory: institutions.category,
				userId: claimRequests.userId,
				userName: users.name,
				userEmail: users.email,
				sourceUrl: claimRequests.sourceUrl,
				description: claimRequests.description,
				status: claimRequests.status,
				createdAt: claimRequests.createdAt,
			})
			.from(claimRequests)
			.innerJoin(institutions, eq(claimRequests.institutionId, institutions.id))
			.innerJoin(users, eq(claimRequests.userId, users.id))
			.where(eq(claimRequests.status, "pending"))
			.orderBy(desc(claimRequests.createdAt));
	},
	["pending-claim-requests"],
	{
		revalidate: 60, // 1 minute
		tags: ["claim-requests", "claim-requests-data"],
	},
);

export async function getPendingClaimRequests() {
	await requireAdminSession();
	return getPendingClaimRequestsInternal();
}

export async function getClaimRequestById(id: number) {
	await requireAdminSession();

	const result = await db
		.select({
			id: claimRequests.id,
			institutionId: claimRequests.institutionId,
			institutionName: institutions.name,
			institutionCategory: institutions.category,
			institutionState: institutions.state,
			institutionCity: institutions.city,
			institutionContributorId: institutions.contributorId,
			userId: claimRequests.userId,
			userName: users.name,
			userEmail: users.email,
			sourceUrl: claimRequests.sourceUrl,
			description: claimRequests.description,
			status: claimRequests.status,
			adminNotes: claimRequests.adminNotes,
			reviewedBy: claimRequests.reviewedBy,
			reviewedAt: claimRequests.reviewedAt,
			createdAt: claimRequests.createdAt,
		})
		.from(claimRequests)
		.innerJoin(institutions, eq(claimRequests.institutionId, institutions.id))
		.innerJoin(users, eq(claimRequests.userId, users.id))
		.where(eq(claimRequests.id, id))
		.limit(1);

	return result[0] || null;
}
