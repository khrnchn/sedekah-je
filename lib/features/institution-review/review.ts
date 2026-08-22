import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { institutions, questMosques, users } from "@/db/schema";
import { sendInstitutionApprovalEmail } from "@/lib/email/approval";
import { buildInstitutionApproveLink } from "@/lib/email/approval-link";
import {
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
	const [reviewer] = await db
		.select({
			role: users.role,
			isActive: users.isActive,
			banned: users.banned,
		})
		.from(users)
		.where(eq(users.id, input.reviewerId))
		.limit(1);
	if (
		!reviewer ||
		reviewer.role !== "admin" ||
		!reviewer.isActive ||
		reviewer.banned
	) {
		throw new Error("Unauthorized: Active admin access required");
	}

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
		async findReviewer(reviewerId) {
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
		},
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
