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

export type BatchReviewInput = {
	institutionIds: number[];
	reviewerId: string;
	decision: InstitutionReviewDecision;
	adminNotes?: string;
};

export type ReviewerRecord = {
	role: string;
	isActive: boolean;
	banned: boolean | null;
};

/**
 * Being an admin is not enough: a deactivated or banned account keeps its role
 * row, so both the single and the batch path have to check all three.
 */
export function assertActiveAdminReviewer(
	reviewer: ReviewerRecord | null,
): void {
	if (
		!reviewer ||
		reviewer.role !== "admin" ||
		!reviewer.isActive ||
		reviewer.banned
	) {
		throw new Error("Unauthorized: Active admin access required");
	}
}

type InstitutionReviewStore<Row extends InstitutionReviewResult> = {
	findReviewer: (reviewerId: string) => Promise<ReviewerRecord | null>;
	transitionPending: (input: ReviewInput) => Promise<Row | null>;
};

type InstitutionBatchReviewStore<Row extends InstitutionReviewResult> = {
	findReviewer: (reviewerId: string) => Promise<ReviewerRecord | null>;
	transitionManyPending: (input: BatchReviewInput) => Promise<Row[]>;
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
		assertActiveAdminReviewer(reviewer);

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

/**
 * Batch counterpart. Same reviewer gate and same side effects as the single
 * path, but one guarded statement and one revalidation pass for the whole set.
 */
export function createInstitutionBatchReviewModule<
	Row extends InstitutionReviewResult,
>(dependencies: {
	store: InstitutionBatchReviewStore<Row>;
	effects: {
		afterReview: (decision: InstitutionReviewDecision) => void;
		scheduleApprovalEmails: (rows: Row[]) => void;
	};
}) {
	return async function reviewPendingInstitutions(
		input: BatchReviewInput,
	): Promise<Row[]> {
		const reviewer = await dependencies.store.findReviewer(input.reviewerId);
		assertActiveAdminReviewer(reviewer);

		if (input.institutionIds.length === 0) return [];

		const rows = await dependencies.store.transitionManyPending(input);
		if (rows.length === 0) return [];

		try {
			dependencies.effects.afterReview(input.decision);
		} catch (error) {
			console.error("[institution review] post-review effects failed", error);
		}
		if (input.decision === "approved") {
			try {
				dependencies.effects.scheduleApprovalEmails(rows);
			} catch (error) {
				console.error(
					"[institution review] approval email scheduling failed",
					error,
				);
			}
		}
		return rows;
	};
}
