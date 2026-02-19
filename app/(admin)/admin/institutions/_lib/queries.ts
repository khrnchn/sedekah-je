"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { slugify } from "@/lib/utils";
import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { headers } from "next/headers";

// Helper function to generate a unique slug
async function generateUniqueSlug(
	name: string,
	excludeId?: number,
): Promise<string> {
	const baseSlug = slugify(name);
	let slug = baseSlug;
	let counter = 1;

	// Check if slug already exists (excluding the current institution if updating)
	while (true) {
		const whereCondition = excludeId
			? and(eq(institutions.slug, slug), ne(institutions.id, excludeId))
			: eq(institutions.slug, slug);

		const [existing] = await db
			.select({ id: institutions.id })
			.from(institutions)
			.where(whereCondition)
			.limit(1);

		if (!existing) {
			return slug;
		}

		// If slug exists, append counter
		slug = `${baseSlug}-${counter}`;
		counter++;
	}
}

/**
 * Fetch all institutions that are currently pending approval.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
const getPendingInstitutionsInternal = unstable_cache(
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

export async function getPendingInstitutions() {
	await requireAdminSession();
	return getPendingInstitutionsInternal();
}

/**
 * Fetch all institutions that have been rejected.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
const getRejectedInstitutionsInternal = unstable_cache(
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
				adminNotes: institutions.adminNotes,
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

export async function getRejectedInstitutions() {
	await requireAdminSession();
	return getRejectedInstitutionsInternal();
}

/**
 * Fetch all institutions that have been approved.
 * Joins contributor information when available for display purposes.
 * Uses larger limit for better client-side pagination performance.
 */
const getApprovedInstitutionsInternal = unstable_cache(
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

export async function getApprovedInstitutions() {
	await requireAdminSession();
	return getApprovedInstitutionsInternal();
}

/**
 * Get the count of pending institutions for display in sidebar badges
 */
const getPendingInstitutionsCountInternal = unstable_cache(
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

export async function getPendingInstitutionsCount() {
	await requireAdminSession();
	return getPendingInstitutionsCountInternal();
}

/**
 * Get the count of approved institutions for display in sidebar badges
 */
const getApprovedInstitutionsCountInternal = unstable_cache(
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

export async function getApprovedInstitutionsCount() {
	await requireAdminSession();
	return getApprovedInstitutionsCountInternal();
}

/**
 * Get the count of rejected institutions for display in sidebar badges
 */
const getRejectedInstitutionsCountInternal = unstable_cache(
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

export async function getRejectedInstitutionsCount() {
	await requireAdminSession();
	return getRejectedInstitutionsCountInternal();
}

/**
 * Approve a pending institution
 */
export async function approveInstitution(
	id: number,
	_reviewerId: string, // kept for backward-compatibility – ignored
	adminNotes?: string,
) {
	const { session } = await requireAdminSession();
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
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/institutions/approved", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate cached data and counts
	revalidateTag("pending-institutions");
	revalidateTag("approved-institutions");
	revalidateTag("institutions-count");
	revalidateTag("institutions"); // Homepage cache

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
	const { session } = await requireAdminSession();
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
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/institutions/rejected", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate cached data and counts
	revalidateTag("pending-institutions");
	revalidateTag("rejected-institutions");
	revalidateTag("institutions-count");

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
			| "slug"
		>
	>,
) {
	await requireAdminSession();

	// If name is being updated, regenerate the slug
	const updatePayload = { ...payload };
	if (payload.name) {
		const newSlug = await generateUniqueSlug(payload.name, id);
		updatePayload.slug = newSlug;
	}

	const result = await db
		.update(institutions)
		.set(updatePayload)
		.where(eq(institutions.id, id))
		.returning();

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/institutions/approved", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate cached data and counts
	revalidateTag("pending-institutions");
	revalidateTag("approved-institutions");
	revalidateTag("institutions-count");
	revalidateTag("institutions-data");
	revalidateTag("institutions"); // Homepage cache

	return result;
}

/**
 * Get all users for contributor assignment dropdown
 */
const getAllUsersInternal = unstable_cache(
	async () => {
		return db.select().from(users).orderBy(desc(users.createdAt));
	},
	["all-users-list"],
	{
		tags: ["users-data"],
		revalidate: 300, // 5 minutes fallback
	},
);

export async function getAllUsers() {
	await requireAdminSession();
	return getAllUsersInternal();
}

/**
 * Assign or reassign contributor to an approved institution
 */
export async function assignContributorToInstitution(
	institutionId: number,
	contributorId: string | null,
) {
	const { session } = await requireAdminSession();
	// Ensure the operation is performed by an admin
	// Note: requireAdminSession already handles this, but we use the session for reviewerId.
	const reviewerId = session.user.id;

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
	revalidatePath("/admin/institutions/approved", "page");
	revalidateTag("approved-institutions");
	revalidateTag("institutions-data");
	revalidateTag("institutions"); // Homepage cache

	return result;
}

/**
 * Batch approve multiple pending institutions
 */
export async function batchApproveInstitutions(
	ids: number[],
	adminNotes?: string,
) {
	const { session } = await requireAdminSession();
	const reviewerId = session.user.id;

	if (ids.length === 0) {
		throw new Error("No institutions provided for batch approval");
	}

	if (ids.length > 100) {
		throw new Error(
			"Batch size too large. Maximum 100 institutions per batch.",
		);
	}

	// First, verify all institutions exist and are pending
	const existingInstitutions = await db
		.select({ id: institutions.id, status: institutions.status })
		.from(institutions)
		.where(inArray(institutions.id, ids));

	const foundIds = existingInstitutions.map((inst) => inst.id);
	const missingIds = ids.filter((id) => !foundIds.includes(id));
	const nonPendingInstitutions = existingInstitutions.filter(
		(inst) => inst.status !== "pending",
	);

	if (missingIds.length > 0) {
		throw new Error(`Institutions not found: ${missingIds.join(", ")}`);
	}

	if (nonPendingInstitutions.length > 0) {
		throw new Error(
			`Some institutions are not pending: ${nonPendingInstitutions.map((inst) => inst.id).join(", ")}`,
		);
	}

	const result = await db
		.update(institutions)
		.set({
			status: "approved",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes,
		})
		.where(inArray(institutions.id, ids))
		.returning();

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/institutions/approved", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate cached counts for sidebar badges
	revalidateTag("institutions-count");
	revalidateTag("pending-institutions");
	revalidateTag("approved-institutions");

	// Revalidate cached data tables
	revalidateTag("institutions-data");
	revalidateTag("institutions"); // Homepage cache

	return result;
}

/**
 * Undo approval of an institution (e.g. because of duplicates).
 * Moves it from "approved" to "rejected" with a reason.
 */
export async function undoApproval(id: number, adminNotes?: string) {
	const { session } = await requireAdminSession();
	const reviewerId = session.user.id;

	// Verify the institution exists and is approved
	const [institution] = await db
		.select({ id: institutions.id, status: institutions.status })
		.from(institutions)
		.where(eq(institutions.id, id))
		.limit(1);

	if (!institution) {
		throw new Error("Institution not found");
	}

	if (institution.status !== "approved") {
		throw new Error("Can only undo approval for approved institutions");
	}

	const result = await db
		.update(institutions)
		.set({
			status: "rejected",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes: adminNotes || "Approval undone (duplicate)",
		})
		.where(eq(institutions.id, id))
		.returning();

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/approved", "page");
	revalidatePath("/admin/institutions/rejected", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate cached data and counts
	revalidateTag("approved-institutions");
	revalidateTag("rejected-institutions");
	revalidateTag("institutions-count");
	revalidateTag("institutions-data");
	revalidateTag("institutions"); // Homepage cache

	return result;
}

/**
 * Batch undo approval for multiple institutions (e.g. duplicates).
 * Moves them from "approved" to "rejected".
 */
export async function batchUndoApproval(ids: number[], adminNotes?: string) {
	const { session } = await requireAdminSession();
	const reviewerId = session.user.id;

	if (ids.length === 0) {
		throw new Error("No institutions provided for batch undo");
	}

	if (ids.length > 100) {
		throw new Error(
			"Batch size too large. Maximum 100 institutions per batch.",
		);
	}

	// Verify all institutions exist and are approved
	const existingInstitutions = await db
		.select({ id: institutions.id, status: institutions.status })
		.from(institutions)
		.where(inArray(institutions.id, ids));

	const foundIds = existingInstitutions.map((inst) => inst.id);
	const missingIds = ids.filter((id) => !foundIds.includes(id));
	const nonApprovedInstitutions = existingInstitutions.filter(
		(inst) => inst.status !== "approved",
	);

	if (missingIds.length > 0) {
		throw new Error(`Institutions not found: ${missingIds.join(", ")}`);
	}

	if (nonApprovedInstitutions.length > 0) {
		throw new Error(
			`Some institutions are not approved: ${nonApprovedInstitutions.map((inst) => inst.id).join(", ")}`,
		);
	}

	const result = await db
		.update(institutions)
		.set({
			status: "rejected",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes: adminNotes || "Approval undone (duplicate)",
		})
		.where(inArray(institutions.id, ids))
		.returning();

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/approved", "page");
	revalidatePath("/admin/institutions/rejected", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate caches
	revalidateTag("approved-institutions");
	revalidateTag("rejected-institutions");
	revalidateTag("institutions-count");
	revalidateTag("institutions-data");
	revalidateTag("institutions"); // Homepage cache

	return result;
}

/**
 * Batch reject multiple pending institutions
 */
export async function batchRejectInstitutions(
	ids: number[],
	adminNotes?: string,
) {
	const { session } = await requireAdminSession();
	const reviewerId = session.user.id;

	if (ids.length === 0) {
		throw new Error("No institutions provided for batch rejection");
	}

	if (ids.length > 100) {
		throw new Error(
			"Batch size too large. Maximum 100 institutions per batch.",
		);
	}

	// First, verify all institutions exist and are pending
	const existingInstitutions = await db
		.select({ id: institutions.id, status: institutions.status })
		.from(institutions)
		.where(inArray(institutions.id, ids));

	const foundIds = existingInstitutions.map((inst) => inst.id);
	const missingIds = ids.filter((id) => !foundIds.includes(id));
	const nonPendingInstitutions = existingInstitutions.filter(
		(inst) => inst.status !== "pending",
	);

	if (missingIds.length > 0) {
		throw new Error(`Institutions not found: ${missingIds.join(", ")}`);
	}

	if (nonPendingInstitutions.length > 0) {
		throw new Error(
			`Some institutions are not pending: ${nonPendingInstitutions.map((inst) => inst.id).join(", ")}`,
		);
	}

	const result = await db
		.update(institutions)
		.set({
			status: "rejected",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes,
		})
		.where(inArray(institutions.id, ids))
		.returning();

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/institutions/rejected", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate caches
	revalidateTag("pending-institutions");
	revalidateTag("rejected-institutions");
	revalidateTag("institutions-count");

	return {
		success: true,
		message: "Institutions rejected successfully",
	};
}
