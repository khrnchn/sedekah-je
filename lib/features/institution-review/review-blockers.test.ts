import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getReviewBlockerCodes } from "@/lib/features/institution-review/review-blockers";

const reviewable = {
	qrImage: "https://r2.example/qr.png",
	qrContent: "00020101021126",
	address: "Jalan SS 2",
	coords: [3.1, 101.6] as [number, number],
	duplicateInstitutionId: null,
};

describe("review blockers", () => {
	test("reports nothing for a complete submission", () => {
		assert.deepEqual(getReviewBlockerCodes(reviewable), []);
	});

	test("reports a missing qr image", () => {
		assert.deepEqual(getReviewBlockerCodes({ ...reviewable, qrImage: null }), [
			{ code: "qr-image" },
		]);
	});

	test("reports a missing address", () => {
		assert.deepEqual(getReviewBlockerCodes({ ...reviewable, address: null }), [
			{ code: "address" },
		]);
	});

	test("treats whitespace-only text as missing", () => {
		assert.deepEqual(
			getReviewBlockerCodes({
				...reviewable,
				qrImage: "  ",
				qrContent: "\t",
				address: "\n",
			}),
			[{ code: "qr-image" }, { code: "qr-content" }, { code: "address" }],
		);
	});

	test("carries the duplicate institution id", () => {
		assert.deepEqual(
			getReviewBlockerCodes({ ...reviewable, duplicateInstitutionId: 412 }),
			[{ code: "duplicate", duplicateInstitutionId: 412 }],
		);
	});

	test("emits blockers in a stable order", () => {
		assert.deepEqual(
			getReviewBlockerCodes({
				qrImage: null,
				qrContent: null,
				address: null,
				coords: null,
				duplicateInstitutionId: 7,
			}),
			[
				{ code: "qr-image" },
				{ code: "qr-content" },
				{ code: "address" },
				{ code: "coords" },
				{ code: "duplicate", duplicateInstitutionId: 7 },
			],
		);
	});
});
