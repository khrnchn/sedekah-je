"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { reviewPendingInstitution } from "@/lib/features/institution-review/review";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";
import { reverseGeocodeInstitution } from "@/lib/integrations/geocode";
import { slugify } from "@/lib/utils";

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
 * Approve a pending institution
 */
export async function approveInstitution(
	id: number,
	_reviewerId: string, // kept for backward-compatibility – ignored
	adminNotes?: string,
) {
	const { session } = await requireAdminSession();
	const row = await reviewPendingInstitution({
		institutionId: id,
		reviewerId: session.user.id,
		decision: "approved",
		adminNotes,
	});
	return [row];
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
	const row = await reviewPendingInstitution({
		institutionId: id,
		reviewerId: session.user.id,
		decision: "rejected",
		adminNotes,
	});
	return [row];
}

/**
 * Reverse geocode coords for admin tooling (server-side to avoid browser CORS issues).
 */
export async function reverseGeocodeInstitutionByAdmin(
	lat: number,
	lon: number,
) {
	await requireAdminSession();
	return reverseGeocodeInstitution(lat, lon);
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
	if (payload.category) {
		updatePayload.category = normalizeInstitutionCategory(payload.category);
	}
	if (payload.name) {
		updatePayload.name = payload.name.trim();
		const newSlug = await generateUniqueSlug(updatePayload.name, id);
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
	revalidateTag("pending-institutions", "max");
	revalidateTag("approved-institutions", "max");
	revalidateTag("institutions-count", "max");
	revalidateTag("institutions-data", "max");
	revalidateTag("institutions", "max"); // Homepage cache

	return result;
}

/**
 * Assign or reassign contributor to an approved institution
 */
export async function assignContributorToInstitution(
	institutionId: number,
	contributorId: string | null,
) {
	await requireAdminSession();

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
	revalidateTag("approved-institutions", "max");
	revalidateTag("institutions-data", "max");
	revalidateTag("institutions", "max"); // Homepage cache

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
	revalidateTag("approved-institutions", "max");
	revalidateTag("rejected-institutions", "max");
	revalidateTag("institutions-count", "max");
	revalidateTag("institutions-data", "max");
	revalidateTag("institutions", "max"); // Homepage cache

	return result;
}

/**
 * Undo rejection of an institution. Moves it from "rejected" back to "pending"
 * so it can be reviewed again.
 */
export async function undoRejection(id: number, adminNotes?: string) {
	await requireAdminSession();

	const [institution] = await db
		.select({ id: institutions.id, status: institutions.status })
		.from(institutions)
		.where(eq(institutions.id, id))
		.limit(1);

	if (!institution) {
		throw new Error("Institution not found");
	}

	if (institution.status !== "rejected") {
		throw new Error("Can only undo rejection for rejected institutions");
	}

	const result = await db
		.update(institutions)
		.set({
			status: "pending",
			reviewedBy: null,
			reviewedAt: null,
			adminNotes: adminNotes ?? null,
		})
		.where(eq(institutions.id, id))
		.returning();

	revalidatePath("/admin/institutions/rejected", "page");
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/dashboard", "page");

	revalidateTag("rejected-institutions", "max");
	revalidateTag("pending-institutions", "max");
	revalidateTag("institutions-count", "max");
	revalidateTag("institutions-data", "max");

	return result;
}
