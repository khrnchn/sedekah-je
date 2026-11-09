import { and, eq, ne } from "drizzle-orm";
import { institutions, questAttempts, questMosques } from "@/db/schema";
import { type DbOrTx, syncQuestMosques } from "@/lib/features/quest/sync";

export type QuestReviewResult = "reviewed" | "already_linked" | "not_pending";

// `new` attempts follow their listing's review, so only `existing` ones are reviewed here.
export async function reviewExistingQuestAttempt(
	tx: DbOrTx,
	attemptId: number,
	decision: "approved" | "rejected",
	reviewerId: string,
): Promise<QuestReviewResult> {
	const [attempt] = await tx
		.select({
			questMosqueId: questAttempts.questMosqueId,
			institutionId: questAttempts.institutionId,
		})
		.from(questAttempts)
		.where(
			and(
				eq(questAttempts.id, attemptId),
				eq(questAttempts.kind, "existing"),
				eq(questAttempts.status, "pending"),
			),
		)
		.for("update");
	if (!attempt) return "not_pending";

	// Lock the listing so two approvals for it on different mosques run one at a time.
	await tx
		.select({ id: institutions.id })
		.from(institutions)
		.where(eq(institutions.id, attempt.institutionId))
		.for("update");

	let status = decision;
	let result: QuestReviewResult = "reviewed";
	if (decision === "approved") {
		const [linkedElsewhere] = await tx
			.select({ id: questMosques.id })
			.from(questMosques)
			.where(
				and(
					eq(questMosques.institutionId, attempt.institutionId),
					ne(questMosques.id, attempt.questMosqueId),
				),
			)
			.limit(1);
		if (linkedElsewhere) {
			status = "rejected";
			result = "already_linked";
		}
	}

	await tx
		.update(questAttempts)
		.set({ status, reviewedBy: reviewerId, reviewedAt: new Date() })
		.where(eq(questAttempts.id, attemptId));
	await syncQuestMosques(tx, [attempt.questMosqueId]);
	return result;
}
