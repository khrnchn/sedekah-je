export type InstitutionReviewDecision = "approved" | "rejected";

export type InstitutionReviewResult = {
	id: number;
	name: string;
	slug: string;
	category: string;
	state: string;
	city: string;
	contributorId: string | null;
};

type ReviewInput = {
	institutionId: number;
	reviewerId: string;
	decision: InstitutionReviewDecision;
	adminNotes?: string;
};

type InstitutionReviewStore<Row extends InstitutionReviewResult> = {
	findReviewer: (reviewerId: string) => Promise<{
		role: string;
		isActive: boolean;
		banned: boolean | null;
	} | null>;
	transitionPending: (input: ReviewInput) => Promise<Row | null>;
};

type InstitutionReviewEffects<Row extends InstitutionReviewResult> = {
	afterReview: (decision: InstitutionReviewDecision) => void;
	scheduleApprovalEmail: (row: Row) => void;
};

export function createInstitutionReviewModule<
	Row extends InstitutionReviewResult,
>(dependencies: {
	store: InstitutionReviewStore<Row>;
	effects: InstitutionReviewEffects<Row>;
}) {
	return async function reviewPendingInstitution(
		input: ReviewInput,
	): Promise<Row> {
		const reviewer = await dependencies.store.findReviewer(input.reviewerId);
		if (
			!reviewer ||
			reviewer.role !== "admin" ||
			!reviewer.isActive ||
			reviewer.banned
		) {
			throw new Error("Unauthorized: Active admin access required");
		}

		const row = await dependencies.store.transitionPending(input);
		if (!row) throw new Error("Institution not found or not pending");

		try {
			dependencies.effects.afterReview(input.decision);
		} catch (error) {
			console.error("[institution review] post-review effects failed", error);
		}
		if (input.decision === "approved") {
			try {
				dependencies.effects.scheduleApprovalEmail(row);
			} catch (error) {
				console.error(
					"[institution review] approval email scheduling failed",
					error,
				);
			}
		}
		return row;
	};
}
