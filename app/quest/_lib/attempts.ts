import { eq } from "drizzle-orm";
import type { QuestAttemptKind } from "@/db/quest_attempts";
import { institutions, questAttempts, questMosques } from "@/db/schema";
import type { DbOrTx } from "@/lib/features/quest/sync";

// Kept outside the "use server" actions module so it is not exposed as a server action.
export async function insertQuestAttempt(
	tx: DbOrTx,
	input: {
		questMosqueId: number;
		userId: string;
		kind: QuestAttemptKind;
		institutionId: number;
	},
): Promise<
	| { result: "ok"; id: number }
	| { result: "has_qr" }
	| { result: "already_submitted" }
> {
	// Lock only the mosque row; a join here would also lock the linked listing.
	const [mosque] = await tx
		.select({ institutionId: questMosques.institutionId })
		.from(questMosques)
		.where(eq(questMosques.id, input.questMosqueId))
		.for("update");
	if (!mosque) throw new Error(`Quest mosque ${input.questMosqueId} not found`);

	if (mosque.institutionId !== null) {
		const [linked] = await tx
			.select({ status: institutions.status })
			.from(institutions)
			.where(eq(institutions.id, mosque.institutionId));
		if (linked?.status === "approved") return { result: "has_qr" };
	}

	const inserted = await tx
		.insert(questAttempts)
		.values(input)
		.onConflictDoNothing()
		.returning({ id: questAttempts.id });
	return inserted[0]
		? { result: "ok", id: inserted[0].id }
		: { result: "already_submitted" };
}
