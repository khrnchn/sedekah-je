import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	assertActiveAdminReviewer,
	createInstitutionBatchReviewModule,
} from "@/lib/features/institution-review/review-core";

const institution = {
	id: 42,
	name: "Masjid Amanah",
	slug: "masjid-amanah",
	category: "masjid",
	state: "Selangor",
	city: "Petaling Jaya",
	contributorId: "contributor-1",
};

const activeAdmin = { role: "admin", isActive: true, banned: false };

function buildModule(overrides?: {
	findReviewer?: () => Promise<typeof activeAdmin | null>;
	rows?: (typeof institution)[];
	calls?: string[];
}) {
	const calls = overrides?.calls ?? [];
	return createInstitutionBatchReviewModule({
		store: {
			findReviewer: overrides?.findReviewer ?? (async () => activeAdmin),
			transitionManyPending: async (input) => {
				calls.push(
					`transition:${input.decision}:${input.institutionIds.join(",")}`,
				);
				return overrides?.rows ?? [institution];
			},
		},
		effects: {
			afterReview: (decision) => calls.push(`afterReview:${decision}`),
			scheduleApprovalEmails: (rows) => calls.push(`emails:${rows.length}`),
		},
	});
}

describe("active admin reviewer gate", () => {
	test("accepts an active, unbanned admin", () => {
		assert.doesNotThrow(() => assertActiveAdminReviewer(activeAdmin));
	});

	for (const [label, reviewer] of [
		["a missing reviewer", null],
		["a non-admin", { role: "user", isActive: true, banned: false }],
		["a deactivated admin", { role: "admin", isActive: false, banned: false }],
		["a banned admin", { role: "admin", isActive: true, banned: true }],
	] as const) {
		test(`rejects ${label}`, () => {
			assert.throws(
				() => assertActiveAdminReviewer(reviewer),
				/Active admin access required/,
			);
		});
	}
});

describe("institution batch review module", () => {
	test("rejects a deactivated admin before touching any institution", async () => {
		const calls: string[] = [];
		const review = buildModule({
			calls,
			findReviewer: async () => ({
				role: "admin",
				isActive: false,
				banned: false,
			}),
		});

		await assert.rejects(
			review({
				institutionIds: [42, 43],
				reviewerId: "reviewer-1",
				decision: "approved",
			}),
			/Active admin access required/,
		);
		assert.deepEqual(calls, []);
	});

	test("rejects a banned admin before touching any institution", async () => {
		const calls: string[] = [];
		const review = buildModule({
			calls,
			findReviewer: async () => ({
				role: "admin",
				isActive: true,
				banned: true,
			}),
		});

		await assert.rejects(
			review({
				institutionIds: [42],
				reviewerId: "reviewer-1",
				decision: "rejected",
			}),
			/Active admin access required/,
		);
		assert.deepEqual(calls, []);
	});

	test("approves the batch and schedules emails once for the whole set", async () => {
		const calls: string[] = [];
		const review = buildModule({
			calls,
			rows: [institution, { ...institution, id: 43 }],
		});

		const rows = await review({
			institutionIds: [42, 43],
			reviewerId: "reviewer-1",
			decision: "approved",
		});

		assert.equal(rows.length, 2);
		assert.deepEqual(calls, [
			"transition:approved:42,43",
			"afterReview:approved",
			"emails:2",
		]);
	});

	test("does not send approval emails when rejecting", async () => {
		const calls: string[] = [];
		const review = buildModule({ calls });

		await review({
			institutionIds: [42],
			reviewerId: "reviewer-1",
			decision: "rejected",
		});

		assert.deepEqual(calls, ["transition:rejected:42", "afterReview:rejected"]);
	});

	test("skips side effects when nothing was still pending", async () => {
		const calls: string[] = [];
		const review = buildModule({ calls, rows: [] });

		const rows = await review({
			institutionIds: [42],
			reviewerId: "reviewer-1",
			decision: "approved",
		});

		assert.deepEqual(rows, []);
		assert.deepEqual(calls, ["transition:approved:42"]);
	});

	test("does no work for an empty batch", async () => {
		const calls: string[] = [];
		const review = buildModule({ calls });

		const rows = await review({
			institutionIds: [],
			reviewerId: "reviewer-1",
			decision: "approved",
		});

		assert.deepEqual(rows, []);
		assert.deepEqual(calls, []);
	});
});
