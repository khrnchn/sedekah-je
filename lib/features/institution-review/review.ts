import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { db } from "@/db";
import { institutions, questMosques, users } from "@/db/schema";
import { sendInstitutionApprovalEmail } from "@/lib/email/approval";
import { buildInstitutionApproveLink } from "@/lib/email/approval-link";

export type InstitutionReviewDecision = "approved" | "rejected";

export async function reviewPendingInstitution(input: {
	institutionId: number;
	reviewerId: string;
	decision: InstitutionReviewDecision;
	adminNotes?: string;
}) {
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

	const row = await db.transaction(async (tx) => {
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

		if (!updated) {
			throw new Error("Institution not found or not pending");
		}

		if (input.decision === "rejected") {
			await tx
				.update(questMosques)
				.set({ institutionId: null })
				.where(eq(questMosques.institutionId, input.institutionId));
		}

		return updated;
	});

	revalidatePath("/admin/institutions/pending", "page");
	revalidatePath(
		input.decision === "approved"
			? "/admin/institutions/approved"
			: "/admin/institutions/rejected",
		"page",
	);
	revalidatePath("/admin/dashboard", "page");
	revalidateTag("pending-institutions", "max");
	revalidateTag(
		input.decision === "approved"
			? "approved-institutions"
			: "rejected-institutions",
		"max",
	);
	revalidateTag("institutions-count", "max");

	if (input.decision === "approved") {
		revalidateTag("institutions", "max");
		revalidateTag("leaderboard", "max");
		scheduleApprovalEmail(row);
	} else {
		revalidateTag("quest-mosques", "max");
	}

	return row;
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
	after(work);
}
