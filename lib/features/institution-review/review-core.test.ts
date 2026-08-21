import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createInstitutionReviewModule } from "@/lib/features/institution-review/review-core";

const pendingInstitution = {
	id: 42,
	name: "Masjid Amanah",
	slug: "masjid-amanah",
	category: "masjid",
	state: "Selangor",
	city: "Petaling Jaya",
	contributorId: "contributor-1",
};

describe("institution review module", () => {
	test("rejects a reviewer who is not an active admin", async () => {
		let transitioned = false;
		const review = createInstitutionReviewModule({
			store: {
				findReviewer: async () => ({
					role: "user",
					isActive: true,
					banned: false,
				}),
				transitionPending: async () => {
					transitioned = true;
					return pendingInstitution;
				},
			},
			effects: {
				afterReview: () => {},
				scheduleApprovalEmail: () => {},
			},
		});

		await assert.rejects(
			review({
				institutionId: 42,
				reviewerId: "reviewer-1",
				decision: "approved",
			}),
			/Active admin access required/,
		);
		assert.equal(transitioned, false);
	});

	test("approves a still-pending institution and schedules its side effects", async () => {
		const calls: string[] = [];
		const review = createInstitutionReviewModule({
			store: {
				findReviewer: async () => ({
					role: "admin",
					isActive: true,
					banned: false,
				}),
				transitionPending: async (input) => {
					calls.push(`transition:${input.decision}:${input.adminNotes}`);
					return pendingInstitution;
				},
			},
			effects: {
				afterReview: (decision) => calls.push(`effects:${decision}`),
				scheduleApprovalEmail: (row) => calls.push(`email:${row.id}`),
			},
		});

		const result = await review({
			institutionId: 42,
			reviewerId: "reviewer-1",
			decision: "approved",
			adminNotes: "Verified from Telegram",
		});

		assert.equal(result.id, 42);
		assert.deepEqual(calls, [
			"transition:approved:Verified from Telegram",
			"effects:approved",
			"email:42",
		]);
	});

	test("reports a stale review without running side effects", async () => {
		let sideEffectsRan = false;
		const review = createInstitutionReviewModule({
			store: {
				findReviewer: async () => ({
					role: "admin",
					isActive: true,
					banned: false,
				}),
				transitionPending: async () => null,
			},
			effects: {
				afterReview: () => {
					sideEffectsRan = true;
				},
				scheduleApprovalEmail: () => {
					sideEffectsRan = true;
				},
			},
		});

		await assert.rejects(
			review({
				institutionId: 42,
				reviewerId: "reviewer-1",
				decision: "rejected",
			}),
			/Institution not found or not pending/,
		);
		assert.equal(sideEffectsRan, false);
	});

	test("keeps a committed review successful when post-review effects fail", async () => {
		const originalConsoleError = console.error;
		console.error = () => {};
		try {
			const review = createInstitutionReviewModule({
				store: {
					findReviewer: async () => ({
						role: "admin",
						isActive: true,
						banned: false,
					}),
					transitionPending: async () => pendingInstitution,
				},
				effects: {
					afterReview: () => {
						throw new Error("Next request context is unavailable");
					},
					scheduleApprovalEmail: () => {
						throw new Error("Next after() context is unavailable");
					},
				},
			});

			const result = await review({
				institutionId: 42,
				reviewerId: "reviewer-1",
				decision: "approved",
			});

			assert.equal(result.id, 42);
		} finally {
			console.error = originalConsoleError;
		}
	});
});
