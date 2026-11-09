"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { questAttempts } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth-helpers";
import { syncQuestMosques } from "@/lib/features/quest/sync";

export async function reviewQuestAttempt(
	attemptId: number,
	decision: "approved" | "rejected",
): Promise<void> {
	const { session } = await requireAdminSession();
	if (!Number.isInteger(attemptId) || attemptId < 1) {
		throw new Error("Invalid quest attempt");
	}
	if (decision !== "approved" && decision !== "rejected") {
		throw new Error("Invalid decision");
	}

	// `new` attempts follow their listing's review, so only `existing` ones are reviewed here.
	await db.transaction(async (tx) => {
		const [updated] = await tx
			.update(questAttempts)
			.set({
				status: decision,
				reviewedBy: session.user.id,
				reviewedAt: new Date(),
			})
			.where(
				and(
					eq(questAttempts.id, attemptId),
					eq(questAttempts.kind, "existing"),
					eq(questAttempts.status, "pending"),
				),
			)
			.returning({ questMosqueId: questAttempts.questMosqueId });
		if (!updated) return;
		await syncQuestMosques(tx, [updated.questMosqueId]);
	});

	revalidateTag("quest-mosques", "max");
	revalidatePath("/admin/quest", "page");
}
