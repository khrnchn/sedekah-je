import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { institutions, questMosques, users } from "@/db/schema";
import { sendInstitutionApprovalEmail } from "@/lib/email/approval";
import { buildInstitutionApproveLink } from "@/lib/email/approval-link";
import {
	assertActiveAdminReviewer,
	createInstitutionBatchReviewModule,
	createInstitutionReviewModule,
	type InstitutionReviewDecision,
} from "@/lib/features/institution-review/review-core";

function runReviewSideEffects(decision: InstitutionReviewDecision) {
	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath(
		decision === "approved"
			? "/admin/institutions/approved"
			: "/admin/institutions/rejected",
		"page",
	);
	revalidatePath("/admin/dashboard", "page");
	revalidateTag("pending-institutions", "max");
	revalidateTag(
		decision === "approved" ? "approved-institutions" : "rejected-institutions",
		"max",
	);
	revalidateTag("institutions-count", "max");

	if (decision === "approved") {
		revalidateTag("institutions", "max");
		revalidateTag("leaderboard", "max");
	} else {
		revalidateTag("quest-mosques", "max");
	}
}

function scheduleApprovalEmail(row: typeof institutions.$inferSelect): void {
	if (!row.contributorId) return;

	const payload = {
		contributorId: row.contributorId,
		category: row.category,
		slug: row.slug,
		name: row.name,
		state: row.state,
		city: row.city,
	};
	workAfterResponse(async () => {
		try {
			const [contributor] = await db
				.select({ email: users.email, name: users.name })
				.from(users)
				.where(eq(users.id, payload.contributorId))
				.limit(1);
			if (!contributor?.email) return;

			const send = await sendInstitutionApprovalEmail({
				recipientEmail: contributor.email,
				recipientName: contributor.name ?? null,
				approveLink: buildInstitutionApproveLink(
					payload.category,
					payload.slug,
				),
				city: payload.city,
				state: payload.state,
				category: payload.category,
				institutionName: payload.name,
			});
			if (!send.ok) console.error("[approval email]", send.error);
		} catch (error) {
			console.error("[approval email]", error);
		}
	});
}

function workAfterResponse(work: () => Promise<void>): void {
	try {
		after(work);
	} catch {
		void work();
	}
}

export async function undoInstitutionReview(input: {
	institutionId: number;
	reviewerId: string;
}): Promise<typeof institutions.$inferSelect | null> {
	assertActiveAdminReviewer(await findReviewer(input.reviewerId));

	return db.transaction(async (tx) => {
		const [current] = await tx
			.select({ status: institutions.status })
			.from(institutions)
			.where(eq(institutions.id, input.institutionId))
			.limit(1);
		if (!current || current.status === "pending") return null;

		const [reverted] = await tx
			.update(institutions)
			.set({
				status: "pending",
				reviewedBy: null,
				reviewedAt: null,
				adminNotes: null,
			})
			.where(
				and(
					eq(institutions.id, input.institutionId),
					eq(institutions.status, current.status),
				),
			)
			.returning();
		if (!reverted) return null;

		runReviewSideEffects(current.status as InstitutionReviewDecision);
		return reverted;
	});
}

export const reviewPendingInstitution = createInstitutionReviewModule({
	store: {
		findReviewer,
		async transitionPending(input) {
			return db.transaction(async (tx) => {
				const [updated] = await tx
					.update(institutions)
					.set({
						status: input.decision,
						reviewedBy: input.reviewerId,
						reviewedAt: new Date(),
						adminNotes: input.adminNotes,
					})
					.where(
						and(
							eq(institutions.id, input.institutionId),
							eq(institutions.status, "pending"),
						),
					)
					.returning();

				if (!updated) return null;
				if (input.decision === "rejected") {
					await tx
						.update(questMosques)
						.set({ institutionId: null })
						.where(eq(questMosques.institutionId, input.institutionId));
				}
				return updated;
			});
		},
	},
	effects: {
		afterReview: runReviewSideEffects,
		scheduleApprovalEmail,
	},
});

async function findReviewer(reviewerId: string) {
	const [reviewer] = await db
		.select({
			role: users.role,
			isActive: users.isActive,
			banned: users.banned,
		})
		.from(users)
		.where(eq(users.id, reviewerId))
		.limit(1);
	return reviewer ?? null;
}

function scheduleApprovalEmails(
	rows: (typeof institutions.$inferSelect)[],
): void {
	const payloads = rows.flatMap((row) =>
		row.contributorId
			? [
					{
						id: row.id,
						contributorId: row.contributorId,
						category: row.category,
						slug: row.slug,
						name: row.name,
						state: row.state,
						city: row.city,
					},
				]
			: [],
	);
	if (payloads.length === 0) return;

	workAfterResponse(async () => {
		try {
			const contributorIds = [...new Set(payloads.map((p) => p.contributorId))];
			const contributors = await db
				.select({ id: users.id, email: users.email, name: users.name })
				.from(users)
				.where(inArray(users.id, contributorIds));
			const byId = new Map(contributors.map((c) => [c.id, c]));

			const sends = payloads.flatMap((payload) => {
				const contributor = byId.get(payload.contributorId);
				if (!contributor?.email) return [];
				return [
					sendInstitutionApprovalEmail({
						recipientEmail: contributor.email,
						recipientName: contributor.name ?? null,
						approveLink: buildInstitutionApproveLink(
							payload.category,
							payload.slug,
						),
						city: payload.city,
						state: payload.state,
						category: payload.category,
						institutionName: payload.name,
					}).then((send) => {
						if (!send.ok)
							console.error("[approval email]", payload.id, send.error);
					}),
				];
			});

			const results = await Promise.allSettled(sends);
			for (const result of results) {
				if (result.status === "rejected") {
					console.error("[approval email]", result.reason);
				}
			}
		} catch (error) {
			console.error("[approval email]", error);
		}
	});
}

/**
 * Move approved institutions back to rejected, e.g. duplicates caught after the
 * fact. Not a pending review, so it carries its own cache tags: the records are
 * leaving "approved" and the public listings have to drop them.
 */
export async function undoInstitutionApprovals(input: {
	institutionIds: number[];
	reviewerId: string;
	adminNotes?: string;
}): Promise<(typeof institutions.$inferSelect)[]> {
	assertActiveAdminReviewer(await findReviewer(input.reviewerId));
	if (input.institutionIds.length === 0) return [];

	const reverted = await db.transaction(async (tx) => {
		const updated = await tx
			.update(institutions)
			.set({
				status: "rejected",
				reviewedBy: input.reviewerId,
				reviewedAt: new Date(),
				adminNotes: input.adminNotes || "Approval undone (duplicate)",
			})
			.where(
				and(
					inArray(institutions.id, input.institutionIds),
					eq(institutions.status, "approved"),
				),
			)
			.returning();

		if (updated.length > 0) {
			await tx
				.update(questMosques)
				.set({ institutionId: null })
				.where(
					inArray(
						questMosques.institutionId,
						updated.map((row) => row.id),
					),
				);
		}
		return updated;
	});

	if (reverted.length === 0) return [];

	revalidatePath("/admin/institutions/approved", "page");
	revalidatePath("/admin/institutions/rejected", "page");
	revalidatePath("/admin/dashboard", "page");
	revalidateTag("approved-institutions", "max");
	revalidateTag("rejected-institutions", "max");
	revalidateTag("institutions-count", "max");
	revalidateTag("institutions-data", "max");
	revalidateTag("institutions", "max"); // Homepage cache
	revalidateTag("quest-mosques", "max");

	return reverted;
}

export const reviewPendingInstitutions = createInstitutionBatchReviewModule({
	store: {
		findReviewer,
		async transitionManyPending(input) {
			return db.transaction(async (tx) => {
				// The status guard lives in the WHERE, not in a prior read, so two
				// concurrent reviews of the same institution cannot both apply.
				const updated = await tx
					.update(institutions)
					.set({
						status: input.decision,
						reviewedBy: input.reviewerId,
						reviewedAt: new Date(),
						adminNotes: input.adminNotes,
					})
					.where(
						and(
							inArray(institutions.id, input.institutionIds),
							eq(institutions.status, "pending"),
						),
					)
					.returning();

				if (updated.length > 0 && input.decision === "rejected") {
					await tx
						.update(questMosques)
						.set({ institutionId: null })
						.where(
							inArray(
								questMosques.institutionId,
								updated.map((row) => row.id),
							),
						);
				}
				return updated;
			});
		},
	},
	effects: {
		afterReview: runReviewSideEffects,
		scheduleApprovalEmails,
	},
});
