import type { QuestAttemptStatus } from "@/db/quest_attempts";
import type { ExistingInstitution } from "@/lib/queries/institution-duplicate";

export type QuestStatus = "missing" | "in_review" | "has_qr";

export type LinkCandidate = {
	institutionId: number;
	attemptStatus: QuestAttemptStatus;
	institutionStatus: string;
	createdAt: Date;
};

export function deriveQuestStatus(input: {
	linkedInstitutionStatus: "approved" | "pending" | "rejected" | null;
	pendingAttempts: number;
}): QuestStatus {
	if (input.linkedInstitutionStatus === "approved") return "has_qr";
	if (input.linkedInstitutionStatus === null && input.pendingAttempts > 0) {
		return "in_review";
	}
	return "missing";
}

export function resolveQuestLink(
	currentInstitutionId: number | null,
	candidates: LinkCandidate[],
): number | null {
	const valid = candidates.filter(
		(candidate) =>
			candidate.attemptStatus === "approved" &&
			candidate.institutionStatus === "approved",
	);
	if (
		valid.some((candidate) => candidate.institutionId === currentInstitutionId)
	) {
		return currentInstitutionId;
	}
	valid.sort(
		(a, b) =>
			a.createdAt.getTime() - b.createdAt.getTime() ||
			a.institutionId - b.institutionId,
	);
	return valid[0]?.institutionId ?? null;
}

export function classifyQuestQr(input: {
	duplicate: { existingInstitution?: ExistingInstitution } | null;
	linkedToQuestMosqueId: number | null;
}):
	| { kind: "new" }
	| { kind: "existing"; institutionId: number }
	| { kind: "blocked" } {
	if (!input.duplicate) return { kind: "new" };
	const existing = input.duplicate.existingInstitution;
	if (existing?.status === "approved" && input.linkedToQuestMosqueId === null) {
		return { kind: "existing", institutionId: existing.id };
	}
	return { kind: "blocked" };
}
