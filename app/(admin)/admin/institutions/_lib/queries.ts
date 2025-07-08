"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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
 */
export async function getPendingInstitutions() {
	await requireAdminSession();
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

/**
 * Fetch all institutions that have been rejected.
 * Joins contributor information when available for display purposes.
 */
export async function getRejectedInstitutions() {
	await requireAdminSession();
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
		.orderBy(institutions.createdAt);
}

/**
 * Get the count of pending institutions for display in sidebar badges
 */
export async function getPendingInstitutionsCount() {
	await requireAdminSession();
	const result = await db
		.select({ count: institutions.id })
		.from(institutions)
		.where(eq(institutions.status, "pending"));

	return result.length;
}

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
	return await db
		.update(institutions)
		.set({
			status: "approved",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes,
		})
		.where(eq(institutions.id, id))
		.returning();
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
	return await db
		.update(institutions)
		.set({
			status: "rejected",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes,
		})
		.where(eq(institutions.id, id))
		.returning();
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
