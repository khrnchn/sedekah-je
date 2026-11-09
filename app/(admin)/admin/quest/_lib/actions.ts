"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { reviewExistingQuestAttempt } from "@/app/(admin)/admin/quest/_lib/review";
import { db } from "@/db";
import { requireAdminSession } from "@/lib/auth-helpers";

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

	// A listing already linked to another mosque is rejected instead of approved.
	await db.transaction((tx) =>
		reviewExistingQuestAttempt(tx, attemptId, decision, session.user.id),
	);

	revalidateTag("quest-mosques", "max");
	revalidatePath("/admin/quest", "page");
}
