"use server";

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { institutions } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import {
	reviewPendingInstitutions,
	undoInstitutionApprovals,
} from "@/lib/features/institution-review/review";

const MAX_BATCH_SIZE = 100;

/**
 * Pre-flight so the admin gets a useful error naming the offending ids. The
 * actual guard against a concurrent review is the status condition in the
 * update itself, over in the review module.
 */
async function assertBatchIsInStatus(
	ids: number[],
	expected: (typeof institutions.$inferSelect)["status"],
	action: string,
) {
	if (ids.length === 0) {
		throw new Error(`No institutions provided for batch ${action}`);
	}
	if (ids.length > MAX_BATCH_SIZE) {
		throw new Error(
			`Batch size too large. Maximum ${MAX_BATCH_SIZE} institutions per batch.`,
		);
	}

	const existing = await db
		.select({ id: institutions.id, status: institutions.status })
		.from(institutions)
		.where(inArray(institutions.id, ids));

	const foundIds = existing.map((inst) => inst.id);
	const missingIds = ids.filter((id) => !foundIds.includes(id));
	if (missingIds.length > 0) {
		throw new Error(`Institutions not found: ${missingIds.join(", ")}`);
	}

	const wrongStatus = existing.filter((inst) => inst.status !== expected);
	if (wrongStatus.length > 0) {
		throw new Error(
			`Some institutions are not ${expected}: ${wrongStatus
				.map((inst) => inst.id)
				.join(", ")}`,
		);
	}
}

/**
 * Batch approve multiple pending institutions
 */
export async function batchApproveInstitutions(
	ids: number[],
	adminNotes?: string,
) {
	const { session } = await requireAdminSession();
	await assertBatchIsInStatus(ids, "pending", "approval");

	return reviewPendingInstitutions({
		institutionIds: ids,
		reviewerId: session.user.id,
		decision: "approved",
		adminNotes,
	});
}

/**
 * Batch reject multiple pending institutions
 */
export async function batchRejectInstitutions(
	ids: number[],
	adminNotes?: string,
) {
	const { session } = await requireAdminSession();
	await assertBatchIsInStatus(ids, "pending", "rejection");

	return reviewPendingInstitutions({
		institutionIds: ids,
		reviewerId: session.user.id,
		decision: "rejected",
		adminNotes,
	});
}

/**
 * Batch undo approval for multiple institutions (e.g. duplicates).
 * Moves them from "approved" to "rejected".
 */
export async function batchUndoApproval(ids: number[], adminNotes?: string) {
	const { session } = await requireAdminSession();
	await assertBatchIsInStatus(ids, "approved", "undo");

	return undoInstitutionApprovals({
		institutionIds: ids,
		reviewerId: session.user.id,
		adminNotes,
	});
}
