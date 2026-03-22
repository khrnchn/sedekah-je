"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { institutions, questMosques, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { sendInstitutionApprovalEmail } from "@/lib/email/approval";
import { buildInstitutionApproveLink } from "@/lib/email/approval-link";
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
	const reviewerId = session.user.id;
	const result = await db
		.update(institutions)
		.set({
			status: "approved",
			reviewedBy: reviewerId,
			reviewedAt: new Date(),
			adminNotes,
		})
		.where(and(eq(institutions.id, id), eq(institutions.status, "pending")))
		.returning();

	if (!result[0]) {
		throw new Error("Institution not found or not pending");
	}

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/institutions/approved", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate cached data and counts
	revalidateTag("pending-institutions");
	revalidateTag("approved-institutions");
	revalidateTag("institutions-count");
	revalidateTag("institutions"); // Homepage cache
	revalidateTag("leaderboard");

	// Schedule approval email after response is sent (avoids serverless killing the request)
	const row = result[0];
	const contributorId = row?.contributorId ?? null;
	if (contributorId && row) {
		const payload = {
			contributorId,
			category: row.category,
			slug: row.slug,
			name: row.name,
			state: row.state ?? "",
			city: row.city ?? "",
		};
		after(async () => {
			try {
				const [contributor] = await db
					.select({ email: users.email, name: users.name })
					.from(users)
					.where(eq(users.id, payload.contributorId))
					.limit(1);
				if (contributor?.email) {
					const approveLink = buildInstitutionApproveLink(
						payload.category,
						payload.slug,
					);
					const send = await sendInstitutionApprovalEmail({
						recipientEmail: contributor.email,
						recipientName: contributor.name ?? null,
						approveLink,
						city: payload.city,
						state: payload.state,
						category: payload.category,
						institutionName: payload.name,
					});
					if (!send.ok) {
						console.error("[approval email]", send.error);
					}
				}
			} catch (err) {
				console.error("[approval email]", err);
			}
		});
	}

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
	const result = await db.transaction(async (tx) => {
		const updated = await tx
			.update(institutions)
			.set({
				status: "rejected",
				reviewedBy: reviewerId,
				reviewedAt: new Date(),
				adminNotes,
			})
			.where(and(eq(institutions.id, id), eq(institutions.status, "pending")))
			.returning();

		if (!updated[0]) {
			throw new Error("Institution not found or not pending");
		}

		// Auto-unlock quest mosque: clear institution_id so quest mosque becomes resubmittable
		await tx
			.update(questMosques)
			.set({ institutionId: null })
			.where(eq(questMosques.institutionId, id));

		return updated;
	});

	// Revalidate relevant pages to update the UI
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath("/admin/institutions/rejected", "page");
	revalidatePath("/admin/dashboard", "page");

	// Revalidate cached data and counts
	revalidateTag("pending-institutions");
	revalidateTag("rejected-institutions");
	revalidateTag("institutions-count");
	revalidateTag("quest-mosques");

	return result;
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
	revalidateTag("approved-institutions");
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

	revalidateTag("rejected-institutions");
	revalidateTag("pending-institutions");
	revalidateTag("institutions-count");
	revalidateTag("institutions-data");

	return result;
}
