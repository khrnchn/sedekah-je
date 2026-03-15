"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { institutions, users } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { sendInstitutionApprovalEmail } from "@/lib/email/approval";
import { buildInstitutionApproveLink } from "@/lib/email/approval-link";

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
	revalidateTag("leaderboard");

	// Schedule approval emails after response is sent (avoids serverless killing the request)
	const rows = result.map((r) => ({
		id: r.id,
		contributorId: r.contributorId,
		category: r.category,
		slug: r.slug,
		name: r.name,
		state: r.state ?? "",
		city: r.city ?? "",
	}));
	const hasContributors = rows.some((r) => r.contributorId);
	if (hasContributors) {
		after(async () => {
			try {
				const contributorIds = [
					...new Set(
						rows.map((r) => r.contributorId).filter((id): id is string => !!id),
					),
				];
				const contributors = await db
					.select({ id: users.id, email: users.email, name: users.name })
					.from(users)
					.where(inArray(users.id, contributorIds));
				const contributorMap = new Map(
					contributors.map((c) => [c.id, { email: c.email, name: c.name }]),
				);
				const rowsToEmail = rows.filter((row) => {
					const c = contributorMap.get(row.contributorId ?? "");
					return Boolean(row.contributorId && c?.email);
				});
				const emailPromises = rowsToEmail.map((row) => {
					const c = contributorMap.get(row.contributorId as string);
					const approveLink = buildInstitutionApproveLink(
						row.category,
						row.slug,
					);
					return sendInstitutionApprovalEmail({
						recipientEmail: c!.email,
						recipientName: c!.name ?? null,
						approveLink,
						city: row.city,
						state: row.state,
						category: row.category,
						institutionName: row.name,
					}).then((send) => {
						if (!send.ok) console.error("[approval email]", row.id, send.error);
					});
				});
				const results = await Promise.allSettled(emailPromises);
				results.forEach((r, i) => {
					if (r.status === "rejected")
						console.error("[approval email]", rowsToEmail[i]?.id, r.reason);
				});
			} catch (err) {
				console.error("[approval email]", err);
			}
		});
	}

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

	return result;
}
