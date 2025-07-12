"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { headers } from "next/headers";

// Helper to ensure the current request is being made by an authenticated admin.
async function requireAdminSession() {
	const hdrs = headers();
	const session = await auth.api.getSession({ headers: hdrs });

	if (!session) {
		throw new Error("Unauthorized: Admin access required");
	}

	// Verify role via database to avoid relying on session payload
	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user || user.role !== "admin") {
		throw new Error("Unauthorized: Admin access required");
	}

	return session;
}

/**
 * Fetch all institutions that are currently pending approval.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
export const getPendingInstitutions = unstable_cache(
	async () => {
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
			.orderBy(desc(institutions.createdAt))
			.limit(1000); // Fetch up to 1000 records for client-side pagination
	},
	["pending-institutions-list"],
	{
		tags: ["institutions-data", "pending-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Fetch all institutions that have been rejected.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
export const getRejectedInstitutions = unstable_cache(
	async () => {
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
				reviewedAt: institutions.reviewedAt,
				reviewedBy: institutions.reviewedBy,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.status, "rejected"))
			.orderBy(desc(institutions.createdAt))
			.limit(1000); // Fetch up to 1000 records for client-side pagination
	},
	["rejected-institutions-list"],
	{
		tags: ["institutions-data", "rejected-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Fetch all institutions that have been approved.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
export const getApprovedInstitutions = unstable_cache(
	async () => {
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
				reviewedAt: institutions.reviewedAt,
				reviewedBy: institutions.reviewedBy,
			})
			.from(institutions)
			.leftJoin(users, eq(institutions.contributorId, users.id))
			.where(eq(institutions.status, "approved"))
			.orderBy(desc(institutions.createdAt))
			.limit(1000); // Fetch up to 1000 records for client-side pagination
	},
	["approved-institutions-list"],
	{
		tags: ["institutions-data", "approved-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Get the count of pending institutions for display in sidebar badges
 */
export const getPendingInstitutionsCount = unstable_cache(
	async () => {
		const [result] = await db
			.select({ count: count() })
			.from(institutions)
			.where(eq(institutions.status, "pending"));

		return result.count;
	},
	["pending-institutions-count"],
	{
		tags: ["institutions-count", "pending-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Get the count of approved institutions for display in sidebar badges
 */
export const getApprovedInstitutionsCount = unstable_cache(
	async () => {
		const [result] = await db
			.select({ count: count() })
			.from(institutions)
			.where(eq(institutions.status, "approved"));

		return result.count;
	},
	["approved-institutions-count"],
	{
		tags: ["institutions-count", "approved-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Get the count of rejected institutions for display in sidebar badges
 */
export const getRejectedInstitutionsCount = unstable_cache(
	async () => {
		const [result] = await db
			.select({ count: count() })
			.from(institutions)
			.where(eq(institutions.status, "rejected"));

		return result.count;
	},
	["rejected-institutions-count"],
	{
		tags: ["institutions-count", "rejected-institutions"],
		revalidate: 300, // 5 minutes fallback
	},
);

/**
 * Approve a pending institution
 */
export async function approveInstitution(
	id: number,
	_reviewerId: string, // kept for backward-compatibility – ignored
	adminNotes?: string,
) {
	const session = await requireAdminSession();
	const reviewerId = session.user.id;
	const result = await db
		.update(institutions)
		.set({
			status: "approved",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes,
		})
		.where(eq(institutions.id, id))
		.returning();

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/pending");
	revalidatePath("/admin/institutions/approved");
	revalidatePath("/admin/dashboard");

	// Revalidate cached counts for sidebar badges
	revalidateTag("institutions-count");
	revalidateTag("pending-institutions");
	revalidateTag("approved-institutions");

	// Revalidate cached data tables
	revalidateTag("institutions-data");

	return result;
}

/**
 * Reject a pending institution
 */
export async function rejectInstitution(
	id: number,
	_reviewerId: string, // kept for backward-compatibility – ignored
	adminNotes?: string,
) {
	const session = await requireAdminSession();
	const reviewerId = session.user.id;
	const result = await db
		.update(institutions)
		.set({
			status: "rejected",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes,
		})
		.where(eq(institutions.id, id))
		.returning();

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/pending");
	revalidatePath("/admin/institutions/rejected");
	revalidatePath("/admin/dashboard");

	// Revalidate cached counts for sidebar badges
	revalidateTag("institutions-count");
	revalidateTag("pending-institutions");
	revalidateTag("rejected-institutions");

	// Revalidate cached data tables
	revalidateTag("institutions-data");

	return result;
}

/**
 * Fetch a single pending institution by ID. Includes contributor information.
 */
export async function getPendingInstitutionById(id: number) {
	await requireAdminSession();
	return await db
		.select({
			id: institutions.id,
			name: institutions.name,
			description: institutions.description,
			category: institutions.category,
			state: institutions.state,
			city: institutions.city,
			address: institutions.address,
			supportedPayment: institutions.supportedPayment,
			qrImage: institutions.qrImage,
			qrContent: institutions.qrContent,
			coords: institutions.coords,
			socialMedia: institutions.socialMedia,
			status: institutions.status,
			contributorName: users.name,
			contributorId: users.id,
			contributorEmail: users.email,
			contributorRemarks: institutions.contributorRemarks,
			sourceUrl: institutions.sourceUrl,
			createdAt: institutions.createdAt,
			reviewedBy: institutions.reviewedBy,
			reviewedAt: institutions.reviewedAt,
			adminNotes: institutions.adminNotes,
		})
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(and(eq(institutions.id, id), eq(institutions.status, "pending")))
		.limit(1);
}

/**
 * Fetch a single approved institution by ID. Includes contributor information.
 */
export async function getApprovedInstitutionById(id: number) {
	await requireAdminSession();
	return await db
		.select({
			id: institutions.id,
			name: institutions.name,
			description: institutions.description,
			category: institutions.category,
			state: institutions.state,
			city: institutions.city,
			address: institutions.address,
			supportedPayment: institutions.supportedPayment,
			qrImage: institutions.qrImage,
			qrContent: institutions.qrContent,
			coords: institutions.coords,
			socialMedia: institutions.socialMedia,
			status: institutions.status,
			contributorName: users.name,
			contributorId: users.id,
			contributorEmail: users.email,
			contributorRemarks: institutions.contributorRemarks,
			sourceUrl: institutions.sourceUrl,
			createdAt: institutions.createdAt,
			reviewedBy: institutions.reviewedBy,
			reviewedAt: institutions.reviewedAt,
			adminNotes: institutions.adminNotes,
		})
		.from(institutions)
		.leftJoin(users, eq(institutions.contributorId, users.id))
		.where(and(eq(institutions.id, id), eq(institutions.status, "approved")))
		.limit(1);
}

/**
 * Update institution details (admin edit during review).
 */
export async function updateInstitutionByAdmin(
	id: number,
	payload: Partial<
		Pick<
			typeof institutions.$inferInsert,
			| "name"
			| "description"
			| "category"
			| "state"
			| "city"
			| "address"
			| "supportedPayment"
			| "qrImage"
			| "qrContent"
			| "coords"
			| "socialMedia"
			| "sourceUrl"
			| "contributorRemarks"
		>
	>,
) {
	await requireAdminSession();
	return await db
		.update(institutions)
		.set({ ...payload })
		.where(eq(institutions.id, id))
		.returning();
}

/**
 * Get all users for contributor assignment dropdown
 */
export async function getAllUsers() {
	return await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			username: users.username,
		})
		.from(users)
		.where(eq(users.isActive, true))
		.orderBy(users.name);
}

/**
 * Assign or reassign contributor to an approved institution
 */
export async function assignContributorToInstitution(
	institutionId: number,
	contributorId: string | null,
) {
	// Verify the institution exists and is approved
	const [institution] = await db
		.select({ id: institutions.id, status: institutions.status })
		.from(institutions)
		.where(eq(institutions.id, institutionId))
		.limit(1);

	if (!institution) {
		throw new Error("Institution not found");
	}

	if (institution.status !== "approved") {
		throw new Error("Can only assign contributors to approved institutions");
	}

	// If contributorId is provided, verify the user exists
	if (contributorId) {
		const [user] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.id, contributorId))
			.limit(1);

		if (!user) {
			throw new Error("Contributor not found");
		}
	}

	const result = await db
		.update(institutions)
		.set({ contributorId })
		.where(eq(institutions.id, institutionId))
		.returning();

	// Revalidate approved institutions data
	revalidatePath("/admin/institutions/approved");
	revalidateTag("approved-institutions");
	revalidateTag("institutions-data");

	return result;
}
