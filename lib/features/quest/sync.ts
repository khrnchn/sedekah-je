import { and, eq, inArray, sql } from "drizzle-orm";
import type { db } from "@/db";
import { institutions, questAttempts, questMosques } from "@/db/schema";
import {
	type LinkCandidate,
	resolveQuestLink,
} from "@/lib/features/quest/rules";

export type DbOrTx =
	| typeof db
	| Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function syncQuestForInstitutions(
	tx: DbOrTx,
	institutionIds: number[],
): Promise<number[]> {
	if (institutionIds.length === 0) return [];

	// Only `new` attempts mirror their listing; `existing` attempts are reviewed on their own.
	await tx
		.update(questAttempts)
		.set({
			status: sql`${institutions.status}`,
			reviewedBy: sql`${institutions.reviewedBy}`,
			reviewedAt: sql`${institutions.reviewedAt}`,
		})
		.from(institutions)
		.where(
			and(
				eq(questAttempts.institutionId, institutions.id),
				eq(questAttempts.kind, "new"),
				inArray(questAttempts.institutionId, institutionIds),
			),
		);

	const affected = await tx
		.select({ id: questMosques.id })
		.from(questMosques)
		.where(inArray(questMosques.institutionId, institutionIds))
		.union(
			tx
				.select({ id: questAttempts.questMosqueId })
				.from(questAttempts)
				.where(inArray(questAttempts.institutionId, institutionIds)),
		);
	const mosqueIds = affected.map((row) => row.id).sort((a, b) => a - b);

	await syncQuestMosques(tx, mosqueIds);
	return mosqueIds;
}

export async function syncQuestMosques(
	tx: DbOrTx,
	questMosqueIds: number[],
): Promise<void> {
	if (questMosqueIds.length === 0) return;

	// Lock the mosques so concurrent reviews pick links one at a time.
	const mosques = await tx
		.select({
			id: questMosques.id,
			institutionId: questMosques.institutionId,
			institutionStatus: institutions.status,
			institutionCreatedAt: institutions.createdAt,
		})
		.from(questMosques)
		.leftJoin(institutions, eq(institutions.id, questMosques.institutionId))
		.where(inArray(questMosques.id, questMosqueIds))
		.orderBy(questMosques.id)
		.for("update", { of: questMosques });

	const attempts = await tx
		.select({
			questMosqueId: questAttempts.questMosqueId,
			institutionId: questAttempts.institutionId,
			attemptStatus: questAttempts.status,
			institutionStatus: institutions.status,
			createdAt: questAttempts.createdAt,
		})
		.from(questAttempts)
		.innerJoin(institutions, eq(institutions.id, questAttempts.institutionId))
		.where(inArray(questAttempts.questMosqueId, questMosqueIds));

	for (const mosque of mosques) {
		const candidates: LinkCandidate[] = attempts.filter(
			(attempt) => attempt.questMosqueId === mosque.id,
		);
		// Legacy links predating quest_attempts have no row; keep them while approved.
		if (
			mosque.institutionId !== null &&
			mosque.institutionStatus !== null &&
			mosque.institutionCreatedAt !== null &&
			!candidates.some((c) => c.institutionId === mosque.institutionId)
		) {
			candidates.push({
				institutionId: mosque.institutionId,
				attemptStatus: "approved",
				institutionStatus: mosque.institutionStatus,
				createdAt: mosque.institutionCreatedAt,
			});
		}

		const next = resolveQuestLink(mosque.institutionId, candidates);
		if (next === mosque.institutionId) continue;
		await tx
			.update(questMosques)
			.set({ institutionId: next })
			.where(eq(questMosques.id, mosque.id));
	}
}
